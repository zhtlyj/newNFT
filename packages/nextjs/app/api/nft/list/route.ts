import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '~/services/mongoDB/mongodb';

// 获取或创建模型
const NFT = mongoose.models.NFTS || mongoose.model('NFTS', {
  image: String,
  id: Number,
  name: String,
  attributes: [{
    trait_type: String,
    value: String
  }],
  owner: String,
  price: String,
  description: String,
  CID: String,
  isListed: Boolean,
  createdAt: Date
}, {
  collection: 'NFTS'
});

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { id, isListed, price, owner } = data;

    const updateData: any = { isListed, price };
    if (owner) {
      updateData.owner = owner;
    }

    const nft = await NFT.findOneAndUpdate(
      { id: id },
      updateData,
      { new: true }
    );

    if (!nft) {
      return new NextResponse(
        JSON.stringify({ message: 'NFT不存在' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('NFT更新成功:', nft);

    return new NextResponse(
      JSON.stringify({
        message: isListed ? 'NFT上架成功' : 'NFT下架成功',
        nft
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('更新NFT状态失败:', error);
    return new NextResponse(
      JSON.stringify({
        message: '更新NFT状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 