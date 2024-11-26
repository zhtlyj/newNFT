// dbConfig.ts

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'nfts',
    insecureAuth: true // 使用旧版的身份验证插件
});

export const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('成功获取到MySQL连接');
        return connection;
    } catch (error) {
        console.error('获取MySQL连接出错：', error);
        throw error;
    }
};

export default pool;
