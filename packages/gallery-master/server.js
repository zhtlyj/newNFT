import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import apiRoutes from './routes/api.js';
import dns from 'dns';

// 设置 DNS 解析策略
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const uri = process.env.MONGODB_URI;
console.log('Attempting to connect with URI:', uri.replace(/:([^:@]+)@/, ':****@'));

// 简化客户端配置
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

async function connectDB() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        console.log('Connected to MongoDB');
        
        // 明确指定使用 NFTS 数据库
        const db = client.db('NFTS');
        app.locals.db = db;
        
        app.use('/api', apiRoutes);
        
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});

connectDB().catch(console.error); 