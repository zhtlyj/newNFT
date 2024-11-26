//
// 这个脚本会运行` yarn test `时执行。
//

import { ethers } from "hardhat"; // 导入 hardhat 中的 ethers 库，用于与以太坊进行交互
import { expect } from "chai"; // 导入 Chai 断言库，用于编写测试断言
import { YourCollectible } from "../typechain-types"; // 导入类型定义

describe("版权保护", function () {
  let myContract: YourCollectible; // 声明 YourCollectible 合约实例

  describe("YourCollectible", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS; // 从环境变量中获取合约地址

    let contractArtifact: string;
    if (contractAddress) {
      // 针对自动编译部署合约的设置
      contractArtifact = `contracts/download-${contractAddress}.sol:YourCollectible`;
    } else {
      // 本地开发使用的合约路径
      contractArtifact = "contracts/YourCollectible.sol:YourCollectible";
    }

    it("应该部署智能合约", async function () {
      const YourCollectible = await ethers.getContractFactory(contractArtifact); // 获取合约工厂
      myContract = await YourCollectible.deploy(); // 部署合约
      console.log("\t", " 🛰 合约部署在:", await myContract.getAddress()); // 打印合约地址
    });

    describe("mintItem()", function () {
      it("应该能造出版权", async function () {
        const [owner] = await ethers.getSigners(); // 获取测试账户

        console.log("\t", " 🧑‍🏫 测试账户地址: ", owner.address); // 打印测试账户地址

        const startingBalance = await myContract.balanceOf(owner.address); // 获取初始余额
        console.log("\t", " ⚖️ 初始余额: ", Number(startingBalance)); // 打印初始余额

        console.log("\t", " 🔨 创建中...");
        const mintResult = await myContract.mintItem(owner.address, "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr"); // 铸造 NFT
        console.log("\t", " 🏷  交易哈希: ", mintResult.hash); // 打印交易哈希

        console.log("\t", " ⏳ 等待交易确认...");
        const txResult = await mintResult.wait(); // 等待交易确认
        expect(txResult?.status).to.equal(1); // 断言交易成功

        console.log("\t", " 🔎 刷新检查新余额: ", Number(startingBalance));
        expect(await myContract.balanceOf(owner.address)).to.equal(startingBalance + 1n); // 断言余额增加
      });

      it("Should track tokens of owner by index", async function () {
        const [owner] = await ethers.getSigners(); // 获取测试账户
        const startingBalance = await myContract.balanceOf(owner.address); // 获取初始余额
        const token = await myContract.tokenOfOwnerByIndex(owner.address, startingBalance - 1n); // 获取特定索引的令牌
        expect(token).to.greaterThan(0); // 断言版权 ID 大于 0
      });
    });
  });
});
