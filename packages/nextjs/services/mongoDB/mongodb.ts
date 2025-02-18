import mongoose from 'mongoose';

// 设置默认的MongoDB URI
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017';

// 获取MongoDB URI，如果环境变量未设置则使用默认值
const MONGODB_URI: string = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

// 构建完整的数据库连接字符串
const DB_URI = MONGODB_URI.endsWith('/')
  ? `${MONGODB_URI}NFTS`
  : `${MONGODB_URI}/NFTS`;

console.log('MongoDB连接配置:', {
  uri: DB_URI,
  isDefault: !process.env.MONGODB_URI
});

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  try {
    if (cached.conn) {
      console.log('使用已有的数据库连接');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        family: 4,
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority'
      };

      console.log('正在连接到MongoDB...', DB_URI);
      
      // 先尝试验证连接
      try {
        const testConn = await mongoose.createConnection(DB_URI, opts);
        await testConn.close();
        console.log('MongoDB连接测试成功');
      } catch (testError) {
        console.error('MongoDB连接测试失败:', testError);
        throw new Error(`无法连接到MongoDB: ${testError.message}`);
      }

      cached.promise = mongoose.connect(DB_URI, opts)
        .then((mongoose) => {
          console.log('MongoDB连接成功');
          
          // 设置mongoose调试模式
          mongoose.set('debug', true);
          
          // 监听连接事件
          mongoose.connection.on('error', (err) => {
            console.error('MongoDB连接错误:', err);
          });

          mongoose.connection.on('disconnected', () => {
            console.log('MongoDB连接断开');
            cached.conn = null;
            cached.promise = null;
          });

          return mongoose;
        })
        .catch((error) => {
          console.error('MongoDB连接失败:', error);
          cached.promise = null;
          throw error;
        });
    }

    try {
      cached.conn = await cached.promise;
      console.log('MongoDB连接状态:', mongoose.connection.readyState);
      return cached.conn;
    } catch (connError) {
      cached.promise = null;
      console.error('获取MongoDB连接失败:', connError);
      throw connError;
    }
  } catch (error) {
    console.error('数据库连接过程中出错:', error);
    // 重置连接缓存
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

// 导出连接状态检查函数
export const checkConnection = () => {
  return mongoose.connection.readyState;
};

export default dbConnect;
