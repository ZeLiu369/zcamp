// In backend/src/middleware.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

// 我们需要扩展 Express 的 Request 类型，以便可以附加用户信息
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const authMiddleware: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = (req as any).cookies?.authToken;

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { user: { id: string; username: string } };

    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Token validation failed:', error);
    res.status(403).json({ error: 'Invalid token.' });
    return;
  }
};