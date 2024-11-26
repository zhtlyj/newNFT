import * as dotenv from "dotenv";
dotenv.config(); // 加载 .env 文件中的环境变量
import { ethers, Wallet } from "ethers"; // 导入 ethers 库，用于与以太坊进行交互
import QRCode from "qrcode"; // 导入 qrcode 库，用于生成二维码
import { config } from "hardhat"; // 导入 hardhat 的配置

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY; // 从环境变量中获取部署者的私钥

  if (!privateKey) {
    console.log("🚫️ 你没有部署者账户. 首先运行 `yarn generate`");
    return; // 如果没有私钥，提示用户先生成私钥，并终止程序
  }

  // 使用私钥创建钱包实例
  const wallet = new Wallet(privateKey);
  const address = wallet.address; // 获取钱包地址
  console.log(await QRCode.toString(address, { type: "terminal", small: true })); // 生成钱包地址的二维码并打印到终端
  console.log("公共地址:", address, "\n"); // 打印钱包的公共地址

  // 获取每个网络的余额
  const availableNetworks = config.networks; // 从 hardhat 配置中获取可用的网络配置
  for (const networkName in availableNetworks) {
    try {
      const network = availableNetworks[networkName];
      if (!("url" in network)) continue; // 如果网络配置中没有 URL，跳过该网络
      const provider = new ethers.JsonRpcProvider(network.url); // 创建网络提供者实例
      await provider._detectNetwork(); // 检测网络
      const balance = await provider.getBalance(address); // 获取钱包地址在该网络上的余额
      console.log("--", networkName, "-- 📡");
      console.log("   balance:", +ethers.formatEther(balance)); // 打印余额，单位为以太
      console.log("   nonce:", +(await provider.getTransactionCount(address))); // 打印交易计数（nonce）
    } catch (e) {
      console.log("连接网络失败", networkName); // 如果连接网络失败，打印错误信息
    }
  }
}

// 执行主函数并捕获错误
main().catch(error => {
  console.error(error);
  process.exitCode = 1; // 出现错误时，设置进程退出码为 1
});
