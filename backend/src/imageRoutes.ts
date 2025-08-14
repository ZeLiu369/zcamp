// In backend/src/imageRoutes.ts

import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import crypto from 'crypto'; // Built-in Node.js module
import { authMiddleware, AuthRequest } from './middleware';
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
router.post('/locations/:id/images', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
    const { id: locationId } = req.params;
    const userId = req.user?.id;
    
    if (!req.file) {
        res.status(400).json({ error: 'No image file provided.' });
        return 
    }
    if (!bucketName) {
        res.status(500).json({ error: 'Server configuration error.' });
        return 
    }

    // 3. Generate a unique filename to avoid conflicts in S3
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const s3Key = `${randomBytes}-${req.file.originalname}`;

    // 4. Create the command to upload the file to S3
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    });

    try {
        await s3Client.send(command);

        // 5. Construct the public URL of the uploaded file
        const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // 6. Save the URL and S3 Key to our database
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO campground_images (url, public_id, location_id, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            // We'll store the S3 Key in the 'public_id' column for easy deletion later
            const values = [imageUrl, s3Key, locationId, userId];
            const result = await client.query(query, values);
            
            res.status(201).json(result.rows[0]);
        } 
        catch (dbError) {
            // 3. 如果数据库写入失败，执行补偿操作，删除S3上的文件
            console.error('Database write failed, attempting to delete S3 object...', dbError);
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
            });
            await s3Client.send(deleteCommand);
            // 重新抛出错误，让上层知道操作失败了
            throw dbError;
        }
        finally {
            client.release();
        }
    } catch (error) {
        console.error('Error uploading to S3 or saving to DB:', error);
        res.status(500).json({ error: 'Internal server error during file upload.' });
    }
});

export default router;