// import { NextResponse } from 'next/server';
// import { MongoClient } from 'mongodb';

// const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
// const client = new MongoClient(uri);

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { username, password } = body;

//     // 连接到MongoDB
//     await client.connect();
//     const database = client.db('NFTS');
//     const users = database.collection('Users');

//     // 查找用户并验证密码
//     const user = await users.findOne({ 
//       username,
//       password // 直接比对密码
//     });
    
//     // 如果用户不存在或密码错误
//     if (!user) {
//       return NextResponse.json(
//         { error: '用户名或密码错误' },
//         { status: 400 }
//       );
//     }

//     // 登录成功，返回用户信息（不包含密码）
//     const { password: _, ...userWithoutPassword } = user;
//     return NextResponse.json({
//       message: '登录成功',
//       user: userWithoutPassword
//     });

//   } catch (error) {
//     console.error('登录错误:', error);
//     return NextResponse.json(
//       { error: '登录失败' },
//       { status: 500 }
//     );
//   } finally {
//     await client.close();
//   }
// } 