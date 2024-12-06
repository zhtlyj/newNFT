import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

export async function POST(request: Request) {
  const client = new MongoClient(uri);
  
  try {
    const body = await request.json();
    const { username, password, email, type } = body;

    // 连接到MongoDB
    await client.connect();
    const database = client.db('NFTS');
    const users = database.collection('Users');

    // 检查用户名是否已存在
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { message: '用户名已存在' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: '邮箱已被注册' },
        { status: 400 }
      );
    }

    // 创建新用户
    const result = await users.insertOne({
      username,
      password,
      email,
      type,
      createdAt: new Date()
    });

    return NextResponse.json(
      { message: '注册成功', userId: result.insertedId },
      { status: 201 }
    );

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { message: '注册失败' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 