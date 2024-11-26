import { ethers } from "ethers"; // 导入 ethers 库，用于与以太坊进行交互
import { parse, stringify } from "envfile"; // 导入 envfile 库，用于解析和序列化 .env 文件
import * as fs from "fs"; // 导入 fs 模块，用于文件系统操作

const envFilePath = "./.env"; // 定义 .env 文件的路径

/**
 * 生成一个新的随机私钥并写入 .env 文件
 * @param existingEnvConfig 当前的 .env 文件配置（如果存在）
 */
const setNewEnvConfig = (existingEnvConfig = {}) => {
  console.log("👛 正在生成新钱包");
  const randomWallet = ethers.Wallet.createRandom(); // 生成一个新的随机钱包

  const newEnvConfig = {
    ...existingEnvConfig, // 保留现有的 .env 配置
    DEPLOYER_PRIVATE_KEY: randomWallet.privateKey, // 添加新的私钥到配置中
  };

  // 将新的配置写入 .env 文件
  fs.writeFileSync(envFilePath, stringify(newEnvConfig));
  console.log("📄 私钥保存到了.env文件");
  console.log("🪄 生成的钱包地址:", randomWallet.address); // 输出生成的钱包地址
};
//main函数
async function main() {
  if (!fs.existsSync(envFilePath)) {
    // 如果 .env 文件不存在，生成新的配置
    setNewEnvConfig();
    return;
  }

  // 如果 .env 文件存在
  const existingEnvConfig = parse(fs.readFileSync(envFilePath).toString()); // 解析现有的 .env 文件
  if (existingEnvConfig.DEPLOYER_PRIVATE_KEY) {
    console.log("⚠️ 你已经有了一个部署者账户。请检查.env文件");
    return;
  }

  // 如果没有 DEPLOYER_PRIVATE_KEY，生成新的配置
  setNewEnvConfig(existingEnvConfig);
}

// 执行主函数并捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 出现错误时，设置进程退出码为 1
});
