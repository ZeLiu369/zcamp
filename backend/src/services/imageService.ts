import crypto from 'crypto';
import { pool } from '#/lib/db.js';
import { s3Client, BUCKET_NAME } from '#/lib/s3.js';
import { 
    PutObjectCommand, 
    DeleteObjectCommand 
} from '@aws-sdk/client-s3';

// 定义上传成功后的S3文件信息接口
interface UploadedS3File {
    s3Key: string;
    originalName: string;
    mimeType: string;
}

export class ImageService {

    /**
     * 为指定地点并行上传多张图片，并处理数据库事务和S3补偿。
     * @param files - 从 multer 获取的文件数组
     * @param locationId - 地点的ID
     * @param userId - 上传用户的ID
     * @returns - 存入数据库的图片记录数组
     */
    public static async uploadManyForLocation(
        files: Express.Multer.File[], 
        locationId: string, 
        userId: string
    ): Promise<any[]> {

        // --- 步骤 1: 并行上传所有文件到 S3 (事务外) ---
        // 这是慢速的网络I/O操作，必须在DB事务开始前完成
        const s3UploadPromises = files.map(file => this.uploadFileToS3(file));
        const uploadedS3Files = await Promise.all(s3UploadPromises);
        /* ... 
        uploadedS3Files:
        [
            { s3Key: 'key1.jpg', originalName: 'a.jpg', mimeType: 'image/jpeg' }, // 第一个Promise的结果
            { s3Key: 'key2.png', originalName: 'b.png', mimeType: 'image/png'  }, // 第二个Promise的结果
            { s3Key: 'key3.gif', originalName: 'c.gif', mimeType: 'image/gif'  }  // 第三个Promise的结果
        ]
        */

        // --- 步骤 2: 执行短暂、快速的数据库事务 ---
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dbInsertPromises = uploadedS3Files.map(({ s3Key }) => {
                const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
                const query = `
                    INSERT INTO campground_images (url, public_id, location_id, user_id)
                    VALUES ($1, $2, $3, $4) RETURNING *;
                `;
                return client.query(query, [imageUrl, s3Key, locationId, userId]);
            });
            /*
            [
                Promise<pending>, // Represents the INSERT for the first image
                Promise<pending>, // Represents the INSERT for the second image
                Promise<pending>  
              ]
            */
            const results = await Promise.all(dbInsertPromises);

            await client.query('COMMIT');
            return results.map(res => res.rows[0]);

        } catch (dbError) {
            // --- 步骤 3: 如果DB事务失败，执行补偿操作 ---
            await client.query('ROLLBACK');
            console.error('数据库事务失败，正在回滚...', dbError);
            
            // 尝试清理已上传到S3的孤儿文件
            const keysToClean = uploadedS3Files.map(file => file.s3Key);
            await this.deleteFilesFromS3(keysToClean);

            // 将原始错误向上抛出，以便路由层捕获
            throw dbError;
        } finally {
            client.release();
        }
    }

    /**
     * 将单个文件上传到S3
     * @param file - Multer文件对象
     * @returns - 包含s3Key等信息的Promise
     */
    private static async uploadFileToS3(file: Express.Multer.File): Promise<UploadedS3File> {
        const s3Key = `${crypto.randomBytes(16).toString('hex')}-${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await s3Client.send(command);
        return { s3Key, originalName: file.originalname, mimeType: file.mimetype };
    }

    /**
     * 删除一张图片，执行权限检查，并确保操作的健壮性。
     * @param imageId - 要删除的图片的数据库ID
     * @param string - 发起删除请求的用户的ID
     */
    public static async deleteImage(imageId: string, userId: string, userRole: string): Promise<void> {
        const client = await pool.connect();
        let s3KeyToDelete: string | null = null;

        try {
            await client.query('BEGIN');

            // 1. 查询图片信息，同时锁定该行以防止并发修改
            const imageResult = await client.query(
                'SELECT user_id, public_id FROM campground_images WHERE id = $1 FOR UPDATE',
                [imageId]
            );


            if (imageResult.rows.length === 0) {
                // 如果图片一开始就不存在，直接回滚并抛出“未找到”错误
                await client.query('ROLLBACK');
                const error: any = new Error('Image not found.');
                error.statusCode = 404;
                throw error;
            }

            const { user_id: uploaderId, public_id: s3Key } = imageResult.rows[0];
            s3KeyToDelete = s3Key; // 暂存S3 Key，用于事务成功后再删除

            // 2. 执行安全校验
            if (uploaderId !== userId && userRole !== 'admin') {
                await client.query('ROLLBACK');
                const error: any = new Error('Forbidden: You are not authorized to delete this image.');
                error.statusCode = 403;
                throw error;
            }

            // 3. 【核心】先从数据库删除
            await client.query('DELETE FROM campground_images WHERE id = $1', [imageId]);

            // 4. 【核心】提交数据库事务
            await client.query('COMMIT');

        } catch (error) {
            // 如果上述步骤中任何一步出错，回滚并直接向上抛出错误
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        // --- 事务成功后，才执行S3删除 ---
        // 这是一个“至多一次”的操作，即使失败了，我们也优先保证了数据库的一致性
        if (s3KeyToDelete) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3KeyToDelete,
                });
                await s3Client.send(deleteCommand);
                console.log(`Successfully deleted ${s3KeyToDelete} from S3.`);
            } catch (s3Error) {
                // S3删除失败是一个需要被记录和监控的事件，但不应该让整个API请求失败
                // 因为从用户的角度，图片已经成功“删除”了（数据库里没了）
                console.error(`CRITICAL: Database record for ${s3KeyToDelete} was deleted, but S3 object deletion failed. Please investigate.`, s3Error);
            }
        }
    }


    /**
     * 从S3并发删除多个文件
     * @param keys - 要删除的S3对象Key数组
     */
    private static async deleteFilesFromS3(keys: string[]): Promise<void> {
        if (keys.length === 0) return;

        console.log(`正在尝试从S3清理 ${keys.length} 个孤儿文件...`);
        try {
            const deletePromises = keys.map(key => {
                const deleteCommand = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
                return s3Client.send(deleteCommand);
            });
            await Promise.all(deletePromises);
            console.log('S3清理成功。');
        } catch (cleanupError) {
            // 这是严重问题，意味着产生了无法自动清理的垃圾数据，必须记录
            console.error('CRITICAL: 清理S3孤儿文件失败，请手动检查。', cleanupError);
        }
    }
}