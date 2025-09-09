import crypto from 'crypto';
import { pool } from '#app/lib/db.js';
import { s3Client, BUCKET_NAME } from '#app/lib/s3.js';
import { 
    PutObjectCommand, 
    DeleteObjectCommand 
} from '@aws-sdk/client-s3';

// Define interface for S3 file information after successful upload
interface UploadedS3File {
    s3Key: string;
    originalName: string;
    mimeType: string;
}

export class ImageService {

    /**
     * Upload multiple images for a specified location in parallel, and handle database transactions and S3 compensation.
     * @param files - File array from multer
     * @param locationId - Location ID
     * @param userId - Uploading user ID
     * @returns - Array of image records stored in database
     */
    public static async uploadManyForLocation(
        files: Express.Multer.File[], 
        locationId: string, 
        userId: string
    ): Promise<any[]> {

        // --- Step 1: Upload all files to S3 in parallel (outside transaction) ---
        // This is slow network I/O operation, must be completed before DB transaction starts
        const s3UploadPromises = files.map(file => this.uploadFileToS3(file));
        const uploadedS3Files = await Promise.all(s3UploadPromises);
        /* ... 
        uploadedS3Files:
        [
            { s3Key: 'key1.jpg', originalName: 'a.jpg', mimeType: 'image/jpeg' }, // Result of first Promise
            { s3Key: 'key2.png', originalName: 'b.png', mimeType: 'image/png'  }, // Result of second Promise
            { s3Key: 'key3.gif', originalName: 'c.gif', mimeType: 'image/gif'  }  // Result of third Promise
        ]
        */

        // --- Step 2: Execute short, fast database transaction ---
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
            // --- Step 3: If DB transaction fails, execute compensation operation ---
            await client.query('ROLLBACK');
            console.error('Database transaction failed, rolling back...', dbError);
            
            // Try to clean up orphaned files already uploaded to S3
            const keysToClean = uploadedS3Files.map(file => file.s3Key);
            await this.deleteFilesFromS3(keysToClean);

            // Throw original error up so route layer can catch it
            throw dbError;
        } finally {
            client.release();
        }
    }

    /**
     * Upload a single file to S3
     * @param file - Multer file object
     * @returns - Promise containing s3Key and other information
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
     * Delete an image, perform permission checks, and ensure operation robustness.
     * @param imageId - Database ID of the image to delete
     * @param string - ID of the user making the delete request
     */
    public static async deleteImage(imageId: string, userId: string, userRole: string): Promise<void> {
        const client = await pool.connect();
        let s3KeyToDelete: string | null = null;

        try {
            await client.query('BEGIN');

            // 1. Query image information while locking the row to prevent concurrent modifications
            const imageResult = await client.query(
                'SELECT user_id, public_id FROM campground_images WHERE id = $1 FOR UPDATE',
                [imageId]
            );


            if (imageResult.rows.length === 0) {
                // If image doesn't exist from the start, rollback directly and throw "not found" error
                await client.query('ROLLBACK');
                const error: any = new Error('Image not found.');
                error.statusCode = 404;
                throw error;
            }

            const { user_id: uploaderId, public_id: s3Key } = imageResult.rows[0];
            s3KeyToDelete = s3Key; // Store S3 Key temporarily, for deletion after transaction succeeds

            // 2. Perform security validation
            if (uploaderId !== userId && userRole !== 'admin') {
                await client.query('ROLLBACK');
                const error: any = new Error('Forbidden: You are not authorized to delete this image.');
                error.statusCode = 403;
                throw error;
            }

            // 3. [Core] Delete from database first
            await client.query('DELETE FROM campground_images WHERE id = $1', [imageId]);

            // 4. [Core] Commit database transaction
            await client.query('COMMIT');

        } catch (error) {
            // If any of the above steps fail, rollback and throw error directly up
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        // --- Only execute S3 deletion after transaction succeeds ---
        // This is an "at most once" operation, even if it fails, we prioritize database consistency
        if (s3KeyToDelete) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3KeyToDelete,
                });
                await s3Client.send(deleteCommand);
                console.log(`Successfully deleted ${s3KeyToDelete} from S3.`);
            } catch (s3Error) {
                // S3 deletion failure is an event that needs to be logged and monitored, but should not fail the entire API request
                // Because from user's perspective, the image has been successfully "deleted" (removed from database)
                console.error(`CRITICAL: Database record for ${s3KeyToDelete} was deleted, but S3 object deletion failed. Please investigate.`, s3Error);
            }
        }
    }


    /**
     * Delete multiple files from S3 concurrently
     * @param keys - Array of S3 object Keys to delete
     */
    private static async deleteFilesFromS3(keys: string[]): Promise<void> {
        if (keys.length === 0) return;

        console.log(`Attempting to clean up ${keys.length} orphaned files from S3...`);
        try {
            const deletePromises = keys.map(key => {
                const deleteCommand = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
                return s3Client.send(deleteCommand);
            });
            await Promise.all(deletePromises);
            console.log('S3 cleanup successful.');
        } catch (cleanupError) {
            // This is a serious problem, meaning garbage data was generated that cannot be automatically cleaned up, must be logged
            console.error('CRITICAL: Failed to clean up S3 orphaned files, please check manually.', cleanupError);
        }
    }
}