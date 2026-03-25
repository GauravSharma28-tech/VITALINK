import { Request, Response } from 'express';
import User from '../model/UserModel';
import jwt from 'jsonwebtoken';

export const handleRefreshToken = async (req: Request, res: Response) => {
  const cookie = req.cookies;
  // console.log('Refresh token request received. Cookies:', cookie);
  if (!cookie?.jwt) {
    return res.sendStatus(401);
  }
  console.log(cookie.jwt);
  const refreshToken = cookie.jwt;
  const user = await User.findOne({ refreshToken: cookie.jwt }).exec();
  if (!user) {
    return res.sendStatus(403);
  }

  if (!process.env.REFRESH_TOKEN_SECRET) {
    return res.status(500).json({ message: 'Refresh token secret not set' });
  }
  
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const accessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '30m' }
      );
      console.log('Access token refreshed for user:', decoded.email);
      return res.status(200).json({ accessToken });
    }
  );
};
