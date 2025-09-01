import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express's Request type to allow attaching user information
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
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
    ) as { user: { id: string; username: string; role: string } };

    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Token validation failed:', error);
    res.status(403).json({ error: 'Invalid token.' });
    return;
  }
};