import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';

// 设置 DNS 解析策略
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Attempting to connect with URI:', uri.replace(/:([^:@]+)@/, ':****@'));

const client = new MongoClient(uri);

const nftsData = [
    {
        "image": "https://ipfs.io/ipfs/QmTA4ZLuXNxvRLPfaLNnAn2s5Trn2hr2tdogVqg2YRr7ox",
        "id": 19,
        "name": "篮球",
        "attributes": [
            {
                "trait_type": "category",
                "value": "Virtual world"
            }
        ],
        "owner": "0x8beB99d54a7aD698aFf0eD32888522535ffD1fE2",
        "price": "0.1",
        "description": "展望未来，科技将实现智能生活，推动可持续发展与创新",
        "CID": "QmdWLC1NczNvLZxFEF3LmJRc3ZrYx1A3NrS5miq4BbNso6",
        "isListed": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
    },
    {
        "image": "https://ipfs.io/ipfs/QmQu2uETMSSF1dYYqicwUVrX7FSQNHxe5TGSGpxcTz8i8v",
        "id": 20,
        "name": "足球",
        "attributes": [
            {
                "trait_type": "category",
                "value": "Sports"
            }
        ],
        "owner": "0x8beB99d54a7aD698aFf0eD32888522535ffD1fE2",
        "price": "0.2",
        "description": "体育运动，激发活力，创造精彩人生",
        "CID": "QmVV3heHMpWciKepfs7dgyKzzt9idn7Ur6mkpjER3kcnvD",
        "isListed": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
    }
];

async function importData() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('NFTS');
        const collection = db.collection('NFTS');

        await collection.deleteMany({});
        console.log('Cleared existing data');

        const result = await collection.insertMany(nftsData);
        console.log(`${result.insertedCount} documents were inserted`);

    } catch (error) {
        console.error('Import error:', error);
    } finally {
        await client.close();
        console.log('Import process completed');
    }
}

importData().catch(console.error); 