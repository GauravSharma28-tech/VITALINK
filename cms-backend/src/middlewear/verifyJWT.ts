import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err: any, decoded: any) => {
      if (err) return res.status(403).json({ message: 'Forbidden' });
      req.user = decoded;
      next();
    }
  );
};

export default verifyJWT;
