// In backend/src/imageRoutes.ts

import { Router, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '#/middlewares/authMiddleware.js'
import { ImageService } from '#/services/imageService.js';

const router = Router();

// Configure Multer to store files in memory
// We will get the file as a buffer and stream it directly to S3.
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 限制每个文件最大为 10MB
    },
    fileFilter: (req, file, cb) => {
        // 只接受常见的图片格式
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            // 拒绝其他所有文件类型
            cb(new Error('Invalid file type, only JPEG and PNG is allowed!'));
        }
    }
});

// POST /api/locations/:id/images - Upload an image for a specific campground
router.post(
    '/locations/:id/images', 
    authMiddleware, 
    upload.array('images', 10), // 'images' 是表单字段名，5是最大数量
    async (req: AuthRequest, res: Response): Promise<any> => {
        
        try {
            const { id: locationId } = req.params;
            const userId = req.user?.id;
            const files = req.files as Express.Multer.File[];

            // --- 1. 基本请求验证 ---
            if (!userId) {
                return res.status(403).json({ error: '用户未认证' });
            }
            if (!files || files.length === 0) {
                return res.status(400).json({ error: '未提供任何图片文件。' });
            }

            // --- 2. 调用服务层处理核心逻辑 ---
            const uploadedImages = await ImageService.uploadManyForLocation(files, locationId, userId);

            // --- 3. 成功响应 ---
            return res.status(201).json(uploadedImages);

        } catch (error: any) {
            // --- 4. 统一错误处理 ---
            console.error('图片上传路由捕获到错误:', error);
            // Multer可能会因为文件过大或类型不对抛出特定错误
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ error: `文件上传错误: ${error.message}` });
            }
            // 我们自定义的文件过滤器也会抛出错误
            if (error.message.includes('无效的文件类型')) {
                return res.status(400).json({ error: error.message });
            }
            // 其他所有来自服务层的错误都视为服务器内部错误
            return res.status(500).json({ error: '服务器内部错误，上传失败。' });
        }
    }
);
// backend/src/routes/imageRoutes.ts

// ... (其他路由)

router.delete('/images/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id: imageId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }
        if (!userRole) {
            // Or handle it in a way that makes sense for your app
            return res.status(403).json({ error: 'User role is missing, authorization denied.' });
          }

        await ImageService.deleteImage(imageId, userId, userRole);

        return res.status(200).json({ message: 'Image deleted successfully.' });

    } catch (error: any) {
        console.error(`Failed to delete image ${req.params.id}:`, error);
        // 根据Service层抛出的错误状态码来返回响应
        const statusCode = error.statusCode || 500;
        const message = error.statusCode ? error.message : 'Internal server error';
        return res.status(statusCode).json({ error: message });
    }
});

export default router;