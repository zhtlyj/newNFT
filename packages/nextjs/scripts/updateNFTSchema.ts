import mongoose from 'mongoose';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_URI = MONGODB_URI.endsWith('/') ? `${MONGODB_URI}NFTS` : `${MONGODB_URI}/NFTS`;

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
  isListed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'NFTS'
});

const NFT = mongoose.models.NFTS || mongoose.model('NFTS', NFTSchema);

async function updateNFTSchema() {
  try {
    console.log('正在连接到数据库...');
    await mongoose.connect(DB_URI);
    console.log('数据库连接成功');

    // 获取所有NFT
    const nfts = await NFT.find({});
    console.log(`找到 ${nfts.length} 个NFT记录`);

    // 更新所有没有isListed字段的NFT
    const updateResult = await NFT.updateMany(
      { isListed: { $exists: false } },
      { $set: { isListed: false } }
    );

    console.log('更新结果:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    });

    // 验证更新
    const updatedNfts = await NFT.find({});
    console.log('更新后的NFT示例:', updatedNfts[0]);

  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行迁移
updateNFTSchema().catch(console.error); 