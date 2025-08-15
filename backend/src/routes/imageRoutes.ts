// In backend/src/imageRoutes.ts

import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import crypto from 'crypto'; // Built-in Node.js module
import { authMiddleware, AuthRequest } from '../middleware';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 1. Configure the S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});

const bucketName = process.env.S3_BUCKET_NAME;

// 2. Configure Multer to store files in memory
// We will get the file as a buffer and stream it directly to S3.
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 限制文件大小为 5MB
    },
    fileFilter: (req, file, cb) => {
        // 只接受 jpeg 和 png 格式的图片
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only JPEG and PNG is allowed!'));
        }
    }
});

// POST /api/locations/:id/images - Upload an image for a specific campground
router.post('/locations/:id/images', authMiddleware, upload.array('images', 10), async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: locationId } = req.params;
    const userId = req.user?.id;
    
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({ error: 'No image files provided.' });
        return;
    }

    if (!bucketName) {
        res.status(500).json({ error: 'Server configuration error.' });
        return;
    }

    const files = req.files as Express.Multer.File[];
    const uploadedImages = [];
    const client = await pool.connect();

    try {
        // 并行上传文件到S3
        const s3UploadPromises = files.map(file => {
            const randomBytes = crypto.randomBytes(16).toString('hex');
            const s3Key = `${randomBytes}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read' // 假设需要公开访问
            });
            // 返回一个Promise，它resolve时会带有s3Key和原始文件信息
            return s3Client.send(command).then(() => ({ s3Key, file }));
        });
    
        const uploadedS3Files = await Promise.all(s3UploadPromises);

        // 如果S3上传过程中有任何一个失败，Promise.all会直接reject，代码会进入catch块
        // 此时数据库还未写入任何东西，所以只需返回错误即可，无需清理S3
    } catch (error) {
        await client.query('ROLLBACK');
    console.error('Error during parallel upload process. Rolling back database.', error);

    // 清理逻辑可以做得更智能，检查错误发生在哪个阶段
    // 但一个简单的实现是，如果进入catch，就假设S3可能需要清理
    const s3KeysToClean = (await Promise.allSettled(s3UploadPromises))
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.s3Key);

    if (s3KeysToClean.length > 0) {
        // ... 你的S3并发清理逻辑 ...
    }
    
    res.status(500).json({ error: 'Internal server error during file upload.' });
    } finally {
        client.release();
    }
  
    
});

router.delete('/images/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: imageId } = req.params; // The database UUID of the image record
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated.' });
        return;
    }
    if (!bucketName) {
        res.status(500).json({ error: 'Server configuration error.' });
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First, find the image in our database to get its S3 Key (public_id) and its uploader's ID
        const imageResult = await client.query(
            'SELECT user_id, public_id FROM campground_images WHERE id = $1',
            [imageId]
        );
        
        if (imageResult.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Image not found.' });
            return;
        }

        const uploaderId = imageResult.rows[0].user_id;
        const s3Key = imageResult.rows[0].public_id;

        // SECURITY CHECK: Ensure the person deleting is the person who uploaded it
        if (uploaderId !== userId) {
            await client.query('ROLLBACK');
            res.status(403).json({ error: 'Forbidden: You are not authorized to delete this image.' });
            return;
        }

        // 1. Delete the object from the S3 bucket
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        });
        await s3Client.send(deleteCommand);

        // 2. If S3 deletion is successful, delete the record from our database
        await client.query('DELETE FROM campground_images WHERE id = $1', [imageId]);

        await client.query('COMMIT');

        res.status(200).json({ message: 'Image deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

export default router;