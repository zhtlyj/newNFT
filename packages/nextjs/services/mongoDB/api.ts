import { NextResponse } from 'next/server';
import { MongoClient, Db, Collection, Filter } from 'mongodb';
import { clientPromise } from './mongodb';

// Types
interface NFTDocument {
  nft_id: number;
  nft_name: string;
  nft_image: string;
  CID: string;
  attributes: any;
  owner: string;
  price: number;
  description: string;
  Shelves: number;
  PurchasePrice: number;
  created_at: Date;
}

interface CollectionNFT {
  nft_id: string;
  owner: string;
}

interface ReportNFT {
  nft_id: string;
  owner: string;
  reported_at: Date;
}

interface MintNFTBody {
  nft_id: number;
  nft_name: string;
  nft_image: string;
  CID: string;
  attributes: any;
  owner: string;
  price: number;
  description: string;
}

interface UpdateShelfBody {
  nft_id: number;
  shelvesValue: number;
  price: number;
}

interface PurchaseNFTBody {
  nft_id: number;
  owner: string;
  shelvesValue: number;
}

// NFT 铸造
export async function mintNFT(request: Request) {
  try {
    const body: MintNFTBody = await request.json();
    const { nft_id, nft_name, nft_image, CID, attributes, owner, price, description } = body;

    if (!nft_id || !nft_name || !nft_image || !CID || !attributes || !owner || !price || !description) {
      return NextResponse.json(
        { message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const nftDocument: NFTDocument = {
      nft_id,
      nft_name,
      nft_image,
      CID,
      attributes,
      owner,
      price,
      description,
      Shelves: 0,
      PurchasePrice: 0,
      created_at: new Date()
    };

    const result = await collection.insertOne(nftDocument);

    return NextResponse.json({
      message: 'NFT 成功铸造',
      nftId: result.insertedId,
      savedDocument: nftDocument
    });
  } catch (error) {
    console.error('数据库操作错误:', error);
    return NextResponse.json(
      { message: '保存 NFT 到数据库时发生错误' },
      { status: 500 }
    );
  }
}

// 获取所有 NFT
export async function getNFTs() {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const nfts = await collection.find({}).toArray();
    return NextResponse.json({ nfts });
  } catch (error) {
    console.error('数据库查询错误:', error);
    return NextResponse.json(
      { message: '从数据库获取 NFTs 时发生错误' },
      { status: 500 }
    );
  }
}

// 获取上架的 NFT
export async function getListedNFTs() {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const nfts = await collection.find({ Shelves: 1 }).toArray();

    if (nfts.length > 0) {
      return NextResponse.json({ message: '成功获取上架的 NFT', nfts });
    }
    return NextResponse.json(
      { message: '没有找到上架的 NFT' },
      { status: 404 }
    );
  } catch (error) {
    console.error('数据库查询错误:', error);
    return NextResponse.json(
      { message: '从数据库获取上架的 NFT 时发生错误' },
      { status: 500 }
    );
  }
}

// 获取用户创建的 NFTs
export async function getUserNFTs(address: string) {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const nfts = await collection.find({
      owner: { $regex: new RegExp(address.toLowerCase(), 'i') }
    }).toArray();

    return NextResponse.json({
      nfts: nfts || [],
      message: nfts.length ? '成功获取用户NFTs' : '未找到该用户的NFTs'
    });
  } catch (error) {
    console.error('数据库查询错误:', error);
    return NextResponse.json(
      { message: '获取用户NFTs失败' },
      { status: 500 }
    );
  }
}

// 修改 NFT 上架状态和价格
export async function updateNFTShelf(request: Request) {
  try {
    const body: UpdateShelfBody = await request.json();
    const { nft_id, shelvesValue, price } = body;

    if (nft_id === undefined || shelvesValue === undefined) {
      return NextResponse.json(
        { message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const result = await collection.updateOne(
      { nft_id },
      { 
        $set: { 
          Shelves: shelvesValue,
          PurchasePrice: price
        } 
      }
    );

    if (result.modifiedCount > 0) {
      return NextResponse.json({ 
        message: `NFT ${shelvesValue === 1 ? '成功上架' : '成功下架'}`,
        price: price
      });
    }

    return NextResponse.json(
      { message: '未找到指定的 NFT' },
      { status: 404 }
    );
  } catch (error) {
    console.error('数据库错误:', error);
    return NextResponse.json(
      { message: '更新NFT状态失败' },
      { status: 500 }
    );
  }
}

// 购买 NFT
export async function purchaseNFT(request: Request) {
  try {
    const body: PurchaseNFTBody = await request.json();
    const { nft_id, owner, shelvesValue } = body;

    if (nft_id === undefined || owner === undefined || shelvesValue === undefined) {
      return NextResponse.json(
        { message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    const result = await collection.updateOne(
      { nft_id },
      { $set: { owner, Shelves: shelvesValue }}
    );

    if (result.modifiedCount > 0) {
      return NextResponse.json({ 
        message: `NFT ${shelvesValue === 0 ? '购买成功' : '购买失败'}`
      });
    }

    return NextResponse.json(
      { message: '未找到指定的 NFT' },
      { status: 404 }
    );
  } catch (error) {
    console.error('数据库错误:', error);
    return NextResponse.json(
      { message: '购买NFT失败' },
      { status: 500 }
    );
  }
}

// 收藏相关功能
export async function getFavorites() {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<CollectionNFT>('collection_nfts');

    const nfts = await collection.find().toArray();
    return NextResponse.json({ message: '成功获取收藏的 NFT', nfts });
  } catch (error) {
    console.error('数据库查询错误:', error);
    return NextResponse.json(
      { message: '获取收藏NFT失败' },
      { status: 500 }
    );
  }
}

export async function addFavorite(request: Request) {
  try {
    const body = await request.json();
    const { nftId, owner } = body;

    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<CollectionNFT>('collection_nfts');

    const result = await collection.insertOne({
      nft_id: nftId,
      owner: owner,
    });

    return NextResponse.json({ 
      message: 'NFT added to favorites', 
      insertedId: result.insertedId 
    });
  } catch (error) {
    console.error('数据库插入错误:', error);
    return NextResponse.json(
      { message: '添加收藏失败' },
      { status: 500 }
    );
  }
}

export async function removeFavorite(nftId: string) {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<CollectionNFT>('collection_nfts');

    const result = await collection.deleteOne({ nft_id: nftId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: '未找到该收藏的 NFT' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'NFT 已从收藏中移除' });
  } catch (error) {
    console.error('数据库删除错误:', error);
    return NextResponse.json(
      { message: '移除收藏失败' },
      { status: 500 }
    );
  }
}

// 举报 NFT
export async function reportNFT(request: Request) {
  try {
    const body = await request.json();
    const { nftId, owner } = body;

    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<ReportNFT>('report_nft');

    await collection.insertOne({
      nft_id: nftId,
      owner: owner,
      reported_at: new Date()
    });

    return NextResponse.json({ message: 'NFT 已成功举报' });
  } catch (error) {
    console.error('数据库插入错误:', error);
    return NextResponse.json(
      { message: '举报失败' },
      { status: 500 }
    );
  }
}

// 检查 NFT 是否存在
export async function checkNFTExists(nftId: string) {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    // 将 string 转换为 number
    const numericNftId = parseInt(nftId, 10);
    
    // 确保转换后是有效的数字
    if (isNaN(numericNftId)) {
      return NextResponse.json(
        { error: '无效的 NFT ID' },
        { status: 400 }
      );
    }

    const nft = await collection.findOne({ nft_id: numericNftId });
    return NextResponse.json({ exists: !!nft });
  } catch (error) {
    console.error('检查NFT是否存在时出错:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// NFT 搜索
export async function searchNFTs(searchQuery: string) {
  try {
    const client = await clientPromise;
    const database = client.db('NFT');
    const collection = database.collection<NFTDocument>('nfts');

    // 创建查询条件数组
    const conditions: Filter<NFTDocument>[] = [
      { nft_name: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } }
    ];

    // 如果是数字，添加 nft_id 查询
    if (/^-?\d+(\.\d+)?$/.test(searchQuery)) {
      conditions.push({ nft_id: parseInt(searchQuery, 10) });
    }

    // 执行查询
    const query: Filter<NFTDocument> = { $or: conditions };
    const results = await collection.find(query).toArray();
    return NextResponse.json(results);
  } catch (error) {
    console.error('搜索过程中出错:', error);
    return NextResponse.json(
      { message: '搜索失败' },
      { status: 500 }
    );
  }
} 