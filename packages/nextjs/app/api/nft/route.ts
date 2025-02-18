import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect, { checkConnection } from '~/services/mongoDB/mongodb';

// NFT Schema
const NFTSchema = new mongoose.Schema({
  image: { type: String, required: true },
  id: { type: Number, required: true },
  name: { type: String, required: true },
  attributes: [{
    trait_type: String,
    value: String
  }],
  owner: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String },
  CID: { type: String },
  isListed: { 
    type: Boolean, 
    default: false,
    required: true,
    set: v => Boolean(v)
  },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'NFTS',
  strict: true,
  timestamps: true
});

// 添加查询中间件
NFTSchema.pre('find', function() {
  // 确保返回的文档包含所有必要字段
  this.select({
    image: 1,
    id: 1,
    name: 1,
    attributes: 1,
    owner: 1,
    price: 1,
    description: 1,
    CID: 1,
    isListed: 1,
    createdAt: 1
  });
});

// 添加更新中间件
NFTSchema.pre(['save', 'updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate ? this.getUpdate() : this;
  
  // 打印当前操作类型和更新数据
  console.log('Mongoose中间件:', {
    operation: this.op,
    updateData: update,
    isNew: this.isNew
  });

  if (update.$set && 'isListed' in update.$set) {
    update.$set.isListed = Boolean(update.$set.isListed);
    console.log('转换后的isListed值:', update.$set.isListed);
  }

  next();
});

// 获取或创建模型
const NFT = mongoose.models.NFTS || mongoose.model('NFTS', NFTSchema);

// PUT 处理函数 - 处理上架/下架
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { id, isListed, price, owner } = data;

    console.log('1. 收到PUT请求数据:', { 
      id, 
      isListed, 
      isListedType: typeof isListed,
      price, 
      owner 
    });

    // 使用原子操作进行更新
    const updateResult = await NFT.findOneAndUpdate(
      { id: id }, // 查询条件
      [  // 使用聚合管道进行更新
        {
          $set: {
            isListed: { $toBool: isListed }, // 使用 $toBool 操作符
            price: { $ifNull: [price, ''] },
            ...(owner && { owner: owner }),
            lastUpdated: new Date()
          }
        }
      ],
      {
        new: true,
        runValidators: true,
        upsert: false
      }
    );

    console.log('2. 更新结果:', {
      success: !!updateResult,
      updateResult,
      newIsListed: updateResult?.isListed,
      newIsListedType: typeof updateResult?.isListed
    });

    if (!updateResult) {
      return new NextResponse(
        JSON.stringify({ message: 'NFT不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证更新
    const verifiedNFT = await NFT.findOne({ id }).lean();
    
    // 如果更新未生效，使用原生 MongoDB 命令更新
    if (verifiedNFT?.isListed !== Boolean(isListed)) {
      console.log('3. 使用原生更新命令');
      const db = mongoose.connection.db;
      await db.collection('NFTS').updateOne(
        { id: id },
        { $set: { isListed: Boolean(isListed) } }
      );
      
      // 最终验证
      const finalNFT = await NFT.findOne({ id }).lean();
      console.log('4. 最终状态:', {
        isListed: finalNFT?.isListed,
        type: typeof finalNFT?.isListed
      });
      
      return new NextResponse(
        JSON.stringify({
          message: isListed ? 'NFT上架成功' : 'NFT下架成功',
          nft: finalNFT
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: isListed ? 'NFT上架成功' : 'NFT下架成功',
        nft: verifiedNFT
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('更新失败:', error);
    return new NextResponse(
      JSON.stringify({
        message: '更新NFT状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST 处理函数 - 创建新NFT
export async function POST(request: Request) {
  console.log('开始处理 POST 请求');
  
  try {
    // 连接数据库
    console.log('正在连接数据库...');
    await dbConnect();
    
    // 检查连接状态
    const connectionState = checkConnection();
    console.log('MongoDB连接状态:', connectionState);
    
    if (connectionState !== 1) {
      throw new Error('MongoDB连接未就绪');
    }
    
    console.log('数据库连接成功');

    // 解析请求数据
    const data = await request.json();
    console.log('收到的NFT数据:', JSON.stringify(data, null, 2));

    // 数据验证
    if (!data.image || !data.name || !data.owner) {
      console.log('数据验证失败:', { image: !!data.image, name: !!data.name, owner: !!data.owner });
      return new NextResponse(
        JSON.stringify({ 
          message: '缺少必要字段',
          missingFields: {
            image: !data.image,
            name: !data.name,
            owner: !data.owner
          }
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    try {
      // 创建新NFT
      console.log('正在创建新NFT...');
      const newNFT = new NFT(data);
      console.log('NFT模型创建成功，准备保存...');
      
      const savedNFT = await newNFT.save();
      console.log('NFT保存成功:', JSON.stringify(savedNFT, null, 2));

      return new NextResponse(
        JSON.stringify({
          message: 'NFT数据保存成功',
          nft: savedNFT
        }),
        { 
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (saveError) {
      console.error('保存NFT时出错:', saveError);
      return new NextResponse(
        JSON.stringify({
          message: '保存NFT时出错',
          error: saveError instanceof Error ? saveError.message : '未知错误',
          details: saveError
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

  } catch (error) {
    console.error('处理请求时出错:', error);
    return new NextResponse(
      JSON.stringify({
        message: '服务器处理请求时出错',
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        connectionState: checkConnection()
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// GET 处理函数 - 获取NFT列表
export async function GET() {
  try {
    await dbConnect();
    const nfts = await NFT.find().sort({ createdAt: -1 });
    
    return new NextResponse(
      JSON.stringify({ nfts }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('获取NFT数据失败:', error);
    return new NextResponse(
      JSON.stringify({
        message: '获取NFT数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
