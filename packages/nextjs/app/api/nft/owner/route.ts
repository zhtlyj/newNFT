import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '~/services/mongoDB/mongodb';

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

// 获取或创建模型
const NFT = mongoose.models.NFTS || mongoose.model('NFTS', NFTSchema);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('address');

    if (!owner) {
      return new NextResponse(
        JSON.stringify({ 
          message: '缺少钱包地址参数',
          error: 'Missing address parameter' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await dbConnect();

    // 查询指定 owner 的 NFTs
    const nfts = await NFT.find({ 
      owner: { 
        $regex: new RegExp(owner, 'i')
      }
    })
    .select({
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
    })
    .sort({ createdAt: -1 });

    // 如果没有找到 NFTs，返回 404
    if (nfts.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          message: '未找到该钱包地址的 NFT',
          error: 'No NFTs found for this address',
          address: owner
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        message: '获取NFT数据成功',
        nfts
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('获取NFT数据失败:', error);
    return new NextResponse(
      JSON.stringify({
        message: '获取NFT数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 