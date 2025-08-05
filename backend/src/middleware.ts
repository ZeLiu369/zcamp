// In backend/src/middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 我们需要扩展 Express 的 Request 类型，以便可以附加用户信息
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 从请求头中获取令牌
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 格式是 "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { user: { id: string, username: string } };
    // 将解码后的用户信息附加到请求对象上
    req.user = decoded.user;
    // 调用下一个中间件或路由处理器
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};