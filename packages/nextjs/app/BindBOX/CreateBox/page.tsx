"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { notification, Button, Input, Table, Tag, message } from "antd";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";

interface NFTItem {
  id: number;
  name: string;
  image: string;
  owner: string;
  selected: boolean;
}

const CreateBox: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [price, setPrice] = useState("");
  const [selectedNFTs, setSelectedNFTs] = useState<NFTItem[]>([]);
  const [availableNFTs, setAvailableNFTs] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPriceSet, setIsPriceSet] = useState<boolean | null>(null);
  const [priceSetupCompleted, setPriceSetupCompleted] = useState(false);

  // 读取当前盲盒价格
  const { data: currentPrice } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "mysteryBoxPrice",
  });

  // 设置盲盒价格
  const { writeAsync: setMysteryBoxPrice } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "setMysteryBoxPrice",
    args: [BigInt(0)],
  });

  // 添加NFT到盲盒
  const { writeAsync: addAvailableToken } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "addAvailableToken",
    args: [BigInt(0)],
  });

  // 从数据库获取NFT数据
  const fetchNFTs = async () => {
    try {
      const response = await fetch('/api/Nft');
      
      if (!response.ok) {
        throw new Error('获取NFT数据失败');
      }

      const data = await response.json();
      
      if (!data.nfts || !Array.isArray(data.nfts)) {
        throw new Error('NFT数据格式错误');
      }

      // 过滤出当前用户拥有的NFT
      const userNFTs = data.nfts
        .filter((nft: any) => nft.owner?.toLowerCase() === connectedAddress?.toLowerCase())
        .map((nft: any) => ({
          id: nft.id,
          name: nft.name,
          image: nft.image,
          owner: nft.owner,
          selected: false
        }));

      console.log('获取到的用户NFT:', userNFTs);
      setAvailableNFTs(userNFTs);
    } catch (error) {
      console.error('获取NFT数据失败:', error);
      notification.error({
        message: '获取NFT数据失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 在组件加载和地址变更时获取数据
  useEffect(() => {
    if (connectedAddress) {
      fetchNFTs();
    }
  }, [connectedAddress]);

  // 添加动画状态
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingNFT, setAnimatingNFT] = useState<NFTItem | null>(null);

  // 修改价格检查逻辑
  useEffect(() => {
    const checkPrice = async () => {
      try {
        if (currentPrice !== undefined) {
          const priceValue = Number(currentPrice);
          console.log('Current box price:', priceValue);
          setIsPriceSet(priceValue > 0);
        }
      } catch (error) {
        console.error('Error checking price:', error);
        setIsPriceSet(false);
      }
    };

    checkPrice();
  }, [currentPrice]);

  // 修改价格设置处理函数
  const handleSetPrice = async () => {
    try {
      if (!price) {
        message.error("请输入价格");
        return;
      }

      setLoading(true);
      const priceInWei = parseEther(price);
      
      // 显示处理中消息
      message.loading("交易处理中...", 0);

      // 调用合约设置价格
      const result = await setMysteryBoxPrice({ args: [priceInWei] });
      
      if (result) {
        // 清除所有消息
        message.destroy();
        
        message.success("价格设置成功，请等待区块确认");
        setPrice("");
        setPriceSetupCompleted(true);
        
        // 延迟检查价格更新
        setTimeout(async () => {
          try {
            const response = await fetch('/api/Nft/box-price');
            const data = await response.json();
            if (data.price && Number(data.price) > 0) {
              message.success("价格更新已确认，现在可以添加NFT到盲盒了");
            }
          } catch (error) {
            console.error('检查价格更新失败:', error);
          }
        }, 5000); // 5秒后检查
      }

    } catch (error) {
      console.error("设置价格失败:", error);
      // 清除所有消息
      message.destroy();
      message.error(error instanceof Error ? error.message : "设置价格失败");
      setPriceSetupCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  // 处理NFT添加到盲盒
  const handleAddNFTs = async () => {
    try {
      const selectedIds = selectedNFTs.map(nft => nft.id);
      if (selectedIds.length === 0) {
        notification.error({ message: "请选择要添加的NFT" });
        return;
      }

      setLoading(true);
      
      // 为每个NFT播放动画
      for (const nft of selectedNFTs) {
        setAnimatingNFT(nft);
        setIsAnimating(true);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 调用合约
        await addAvailableToken({ args: [BigInt(nft.id)] });
        
        setIsAnimating(false);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      notification.success({ 
        message: "NFT添加成功", 
        description: `已添加 ${selectedIds.length} 个NFT到盲盒` 
      });
      
      // 重置选择状态
      setSelectedNFTs([]);
      // 重新获取NFT列表
      await fetchNFTs();
      setAnimatingNFT(null);
    } catch (error) {
      console.error("添加NFT失败:", error);
      notification.error({ message: "添加NFT失败" });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "预览",
      key: "image",
      render: (nft: NFTItem) => (
        <img src={nft.image} alt={nft.name} className="w-16 h-16 rounded-lg object-cover" />
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "状态",
      key: "status",
      render: (nft: NFTItem) => (
        <Tag color={!isPriceSet ? "default" : nft.selected ? "purple" : "default"}>
          {!isPriceSet ? "请先设置价格" : nft.selected ? "已选择" : "未选择"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a1147] py-8 relative overflow-hidden">
      {/* 背景网格和光效 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-purple-900/20"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse"></div>

      <div className="container mx-auto px-4 relative">
        {/* 标题区域 */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl transition-opacity duration-1000"></div>
          <h1 className="text-5xl font-bold mb-2 cyberpunk-text">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-text-shine">
              Blind Box Management
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Set price and add NFTs to your blind box</p>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 gap-8 relative">
          {/* 价格设置区域 */}
          <div className="bg-[#231564]/50 rounded-xl p-8 backdrop-blur-sm border border-[#3d2b85] hover:border-purple-500 transition-colors relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Price Setting
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-gray-400 mb-2 text-sm">Suggested Price</label>
                <div className="text-purple-400 text-2xl font-bold cyberpunk-number">
                  {currentPrice ? `${Number(currentPrice) / 1e18} ETH` : "Loading..."}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-gray-400 mb-2 text-sm">New Price (ETH)</label>
                <div className="flex gap-4">
                  <Input
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Enter new price"
                    className="
                      bg-[#1a1147] 
                      border border-[#3d2b85] 
                      text-white 
                      hover:border-purple-500 
                      focus:border-purple-500 
                      focus:ring-1 
                      focus:ring-purple-500 
                      focus:outline-none
                      placeholder-gray-500
                      transition-colors
                      [&>input]:bg-transparent
                      [&>input]:text-white
                      [&>input:focus]:bg-[#1a1147]
                      [&>input:hover]:bg-[#1a1147]
                      [&>input:active]:bg-[#1a1147]
                      [&>input::placeholder]:text-gray-500
                    "
                  />
                  <Button
                    onClick={handleSetPrice}
                    loading={loading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 border-none min-w-[120px] h-[40px]"
                  >
                    Set Price
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* NFT选择区域 */}
          <div className="bg-[#231564]/50 rounded-xl p-8 backdrop-blur-sm border border-[#3d2b85] hover:border-purple-500 transition-colors relative group mt-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              NFT Selection
            </h2>

            {!priceSetupCompleted ? (
              // 未完成价格设置状态
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">请先设置盲盒价格</div>
                <div className="text-sm text-purple-400">设置价格后即可选择NFT添加到盲盒</div>
              </div>
            ) : (
              // 已完成价格设置状态，显示NFT选择表格
              <>
                <Table
                  dataSource={availableNFTs}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  onRow={(record) => ({
                    onClick: () => {
                      const newSelected = availableNFTs.map(nft => 
                        nft.id === record.id ? { ...nft, selected: !nft.selected } : nft
                      );
                      setAvailableNFTs(newSelected);
                      setSelectedNFTs(newSelected.filter(nft => nft.selected));
                    },
                    className: `cursor-pointer transition-all ${
                      record.selected ? 'bg-[#3d2b85]/50 scale-[1.02]' : 'hover:bg-[#3d2b85]/30'
                    }`,
                  })}
                  className="[&_.ant-table]:bg-transparent [&_.ant-table-cell]:text-gray-300 [&_.ant-table-row:hover>td]:bg-transparent"
                />

                {/* 添加按钮 */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleAddNFTs}
                    disabled={selectedNFTs.length === 0 || loading}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-all
                      ${selectedNFTs.length === 0 || loading
                        ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }
                    `}
                  >
                    {loading ? "处理中..." : "添加到盲盒"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3D盒子和动画区域 */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <AnimatePresence>
            {isAnimating && animatingNFT && (
              <>
                {/* 飞行的NFT */}
                <motion.div
                  initial={{ scale: 1, x: -200, y: 100, opacity: 1 }}
                  animate={{ scale: 0.5, x: 0, y: 0, opacity: 0.8 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute z-10"
                >
                  <img
                    src={animatingNFT.image}
                    alt={animatingNFT.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </motion.div>

                {/* 3D盒子 */}
                <div className="preserve-3d">
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-40 h-40 relative preserve-3d"
                  >
                    {/* 前面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d translate-z-20" />
                    {/* 后面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d -translate-z-20 rotate-y-180" />
                    {/* 左面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d -translate-x-20 rotate-y-90" />
                    {/* 右面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d translate-x-20 -rotate-y-90" />
                    {/* 上面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d -translate-y-20 rotate-x-90" />
                    {/* 下面 */}
                    <div className="absolute w-full h-full bg-purple-500/30 border-2 border-purple-500 rounded-lg backdrop-blur-sm transform-3d translate-y-20 -rotate-x-90" />
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 添加全局样式 */}
      <style jsx global>{`
        .cyberpunk-text {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5),
                      0 0 20px rgba(168, 85, 247, 0.3),
                      0 0 30px rgba(168, 85, 247, 0.2);
        }

        .cyberpunk-number {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 2px;
        }

        .bg-grid-pattern {
          background-image: linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 3s linear infinite;
        }

        /* 保持原有的3D相关样式 */
        .preserve-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .transform-3d {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        .translate-z-20 {
          transform: translateZ(20px);
        }
        
        .-translate-z-20 {
          transform: translateZ(-20px);
        }
        
        .rotate-y-90 {
          transform: rotateY(90deg);
        }
        
        .-rotate-y-90 {
          transform: rotateY(-90deg);
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .rotate-x-90 {
          transform: rotateX(90deg);
        }
        
        .-rotate-x-90 {
          transform: rotateX(-90deg);
        }
        
        .-translate-x-20 {
          transform: translateX(-20px);
        }
        
        .translate-x-20 {
          transform: translateX(20px);
        }
        
        .-translate-y-20 {
          transform: translateY(-20px);
        }
        
        .translate-y-20 {
          transform: translateY(20px);
        }

        /* 修改 antd 输入框样式 */
        .ant-input {
          background-color: #1a1147 !important;
          color: white !important;
        }

        .ant-input:focus,
        .ant-input-focused {
          background-color: #1a1147 !important;
          box-shadow: none !important;
        }

        .ant-input::placeholder {
          color: rgba(156, 163, 175, 0.5) !important;
        }

        .ant-input-affix-wrapper {
          background-color: #1a1147 !important;
          border-color: #3d2b85 !important;
        }

        .ant-input-affix-wrapper:hover,
        .ant-input-affix-wrapper:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1) !important;
        }

        .ant-input-affix-wrapper-focused {
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.1) !important;
        }

        /* 输入框选中文本的背景色 */
        .ant-input::selection {
          background-color: rgba(168, 85, 247, 0.3) !important;
        }

        /* 输入框自动填充时的背景色 */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a1147 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};

export default CreateBox;
