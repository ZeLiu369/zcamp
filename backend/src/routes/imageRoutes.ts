// In backend/src/imageRoutes.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '#app/middlewares/authMiddleware.js'
import { ImageService } from '#app/services/imageService.js';

const router = Router();

// Configure Multer to store files in memory
// We will get the file as a buffer and stream it directly to S3.
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type, only JPEG and PNG is allowed!')); // Reject the file
    }
};


const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // Limit each file to maximum 10MB
    },
    fileFilter: fileFilter
});

// POST /api/locations/:id/images - Upload an image for a specific campground
router.post(
    '/locations/:id/images', 
    authMiddleware, 
    upload.array('images', 10), // 'images' is the form field name, 10 is the maximum number
    async (req: Request, res: Response): Promise<any> => {
        
        try {
            const { id: locationId } = req.params;
            const userId = req.user?.id;
            const files = req.files as Express.Multer.File[];

            // --- 1. Basic request validation ---
            if (!userId) {
                return res.status(403).json({ error: 'User not authenticated' });
            }
            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'No image files provided.' });
            }

            // --- 2. Call service layer to handle core logic ---
            const uploadedImages = await ImageService.uploadManyForLocation(files, locationId, userId);

            // --- 3. Success response ---
            return res.status(201).json(uploadedImages);

        } catch (error: any) {
            // --- 4. Unified error handling ---
            console.error('Image upload route caught error:', error);
            // Multer may throw specific errors for files that are too large or wrong type
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ error: `File upload error: ${error.message}` });
            }
            // Our custom file filter will also throw errors
            if (error.message.includes('Invalid file type')) {
                return res.status(400).json({ error: error.message });
            }
            // All other errors from service layer are treated as internal server errors
            return res.status(500).json({ error: 'Internal server error, upload failed.' });
        }
    }
);
// backend/src/routes/imageRoutes.ts

// ... (other routes)

router.delete('/images/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
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
        // Return response based on error status code thrown by Service layer
        const statusCode = error.statusCode || 500;
        const message = error.statusCode ? error.message : 'Internal server error';
        return res.status(statusCode).json({ error: message });
    }
});

export default router;