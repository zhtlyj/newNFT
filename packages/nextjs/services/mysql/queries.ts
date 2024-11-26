// queries.ts

import pool from './dbConfig';

// 插入数据方法
export const insertData = async (id: number, name: string, onChainAddress: string, owner: string, price: number, description: string, attributes: any) => {
    try {
        const connection = await pool.getConnection();
        // 将attributes对象转换为JSON字符串
        const attributesJson = JSON.stringify(attributes);
        const query = `INSERT INTO banquan (id, name, onChainAddress, owner, price, description, attributes) 
                       VALUES (${id}, '${name}', '${onChainAddress}', '${owner}', ${price}, '${description}', '${attributesJson}')`;
        const result = await connection.query(query);
        console.log('成功插入数据：', result);
        connection.release(); // 释放连接
    } catch (err) {
        console.error('插入数据出错：', err);
    }
};

// 查询所有数据方法
export const getAllData = async () => {
    try {
        const connection = await pool.getConnection();
        const query = 'SELECT * FROM banquan';
        const [result] = await connection.query(query);
        connection.release(); // 释放连接
        return result;
    } catch (err) {
        console.error('查询数据出错：', err);
        throw err;
    }
};