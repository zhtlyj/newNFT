// 用户注册的 API 路由（/api/register）

import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const connectDb = async () => {
  if (mongoose.connections[0].readyState) return; // 如果已经连接就不重复连接
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw new Error('数据库连接失败');
  }
};

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password, email } = req.body;

    // 基本的表单验证
    if (!username || !password || !email) {
      return res.status(400).json({ message: '所有字段都是必填项' });
    }

    try {
      await connectDb();

      const userExists = await User.findOne({ $or: [{ username }, { email }] });
      if (userExists) {
        return res.status(400).json({ message: '用户名或邮箱已被注册' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });

      await newUser.save();

      return res.status(201).json({ message: '注册成功' });
    } catch (error) {
      console.error('注册失败:', error);
      return res.status(500).json({ message: '服务器错误，请稍后再试' });
    }
  } else {
    return res.status(405).json({ message: '不允许的请求方法' });
  }
}
