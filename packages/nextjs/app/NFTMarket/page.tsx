"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount, useBalance } from "wagmi";
import { Modal, Button, notification, Pagination, Input } from "antd";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { formatEther, parseEther } from 'viem';
import StepsGuide from "./components/StepsGuide";
import NFTCarousel from "./components/NFTCarousel";
import Image from "next/image";
import { message } from "antd";

interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  description: string;
  CID: string;
}

interface ListedNftInfo {
  id: number;
  price: string;
}

const AllNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]);
  const [listedNFTs, setListedNFTs] = useState<ListedNftInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Collectible | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]);
  const itemsPerPage = 6;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const { writeAsync: purchase } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchase",
  });

  // 获取账户余额
  const { data: balance } = useBalance({
    address: connectedAddress,
  });

  // 从数据库获取已上架的NFT
  const fetchListedNFTs = async () => {
    try {
      const response = await fetch('/api/Nft');
      
      if (!response.ok) {
        throw new Error('获取NFT数据失败');
      }

      const data = await response.json();
      console.log('从数据库获取的原始数据:', data);

      if (!data.nfts || !Array.isArray(data.nfts)) {
        throw new Error('NFT数据格式错误');
      }

      // 过滤并去重上架的NFT
      const uniqueListedNFTs = Array.from(
        new Map(
          data.nfts
            .filter((nft: any) => {
              // 检查NFT是否有效上架
              const isValid = 
                nft.isListed === true && 
                typeof nft.price === 'string' && 
                nft.price.trim() !== '' &&
                parseFloat(nft.price) > 0;

              console.log(`NFT ${nft.id} 状态:`, {
                id: nft.id,
                isListed: nft.isListed,
                price: nft.price,
                isValid
              });

              return isValid;
            })
            .map(nft => [nft.id, nft]) // 使用 id 作为 Map 的键
        ).values()
      );

      console.log('过滤并去重后的NFT列表:', {
        total: uniqueListedNFTs.length,
        nfts: uniqueListedNFTs
      });

      if (uniqueListedNFTs.length > 0) {
        setAllNFTs(uniqueListedNFTs);
        setFilteredNFTs(uniqueListedNFTs);
        
        // 更新价格信息
        const priceInfo = uniqueListedNFTs.map(nft => ({
          id: nft.id,
          price: nft.price
        }));
        setListedNFTs(priceInfo);
      } else {
        console.log('没有找到已上架的NFT');
        setAllNFTs([]);
        setFilteredNFTs([]);
        setListedNFTs([]);
      }

    } catch (error) {
      console.error('获取NFT数据失败:', error);
      notification.error({
        message: '获取NFT数据失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 确保在组件加载和地址变更时获取数据
  useEffect(() => {
    console.log('组件加载或地址变更，开始获取NFT数据');
    fetchListedNFTs();
  }, [connectedAddress]);

  // 添加状态监听
  useEffect(() => {
    console.log('NFT状态更新:', {
      allNFTs: allNFTs.length,
      filteredNFTs: filteredNFTs.length,
      listedNFTs: listedNFTs.length
    });
  }, [allNFTs, filteredNFTs, listedNFTs]);

  // 购买成功后更新NFT状态
  const updateNFTAfterPurchase = async (nftId: number, newOwner: string) => {
    try {
      const response = await fetch('/api/Nft', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: nftId,
          isListed: false,
          price: '',
          owner: newOwner
        }),
      });

      if (!response.ok) {
        throw new Error('更新NFT状态失败');
      }

      // 重新获取NFT列表
      await fetchListedNFTs();
    } catch (error) {
      console.error('更新NFT状态失败:', error);
      notification.error({
        message: '更新NFT状态失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === "") {
      setFilteredNFTs(allNFTs);
    } else {
      const filtered = allNFTs.filter((nft) =>
        nft.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredNFTs(filtered);
      setCurrentPage(1); // 重置到第一页
    }
  };

  useEffect(() => {
    const filtered = allNFTs.filter((nft) =>
      nft.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredNFTs(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [searchText, allNFTs]);

  const openModal = (nft: Collectible) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPriceById = (id: number) => {
    const nft = allNFTs.find(nft => nft.id === id);
    console.log(`获取NFT ${id} 的价格:`, nft?.price || "N/A");
    return nft?.price || "N/A";
  };

  const handlePurchase = async () => {
    if (!selectedNft || !connectedAddress) {
      message.error("请先连接钱包");
      return;
    }

    try {
      // 获取NFT价格并验证
      const price = getPriceById(selectedNft.id);
      if (price === "N/A") {
        message.error("NFT价格无效");
        return;
      }

      // 添加所有者地址验证
      if (!selectedNft.owner) {
        message.error("NFT所有者地址无效");
        return;
      }

      const priceInWei = parseEther(price);
      
      if (balance && balance.value < priceInWei) {
        message.error("余额不足");
        return;
      }

      // 确保地址格式正确
      const ownerAddress = selectedNft.owner.toLowerCase();
      
      // 显示加载中消息
      const hide = message.loading("处理中...", 0);

      try {
        // 调用合约
        const result = await purchase({
          args: [
            BigInt(selectedNft.id),
            ownerAddress,
            priceInWei
          ],
          value: priceInWei,
        });

        // 等待交易被挖矿
        if (result) {
          // 关闭加载消息
          hide();

          // 更新NFT状态
          await updateNFTAfterPurchase(selectedNft.id, connectedAddress);

          message.success("NFT已成功购买并转移到您的账户");
          setIsModalOpen(false);
        }
      } catch (error) {
        // 关闭加载消息
        hide();
        throw error; // 继续抛出错误以便外层 catch 处理
      }

    } catch (error) {
      console.error("Purchase error:", error);
      let errorMessage = "购买失败";
      
      if (error instanceof Error) {
        if (error.message.includes("user rejected transaction")) {
          errorMessage = "用户取消了交易";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "余额不足";
        } else if (error.message.includes("Token does not exist")) {
          errorMessage = "NFT不存在";
        } else if (error.message.includes("From address is not the owner")) {
          errorMessage = "卖家地址验证失败，请确认NFT所有权";
        } else if (error.message.includes("Incorrect price")) {
          errorMessage = "价格不正确";
        }
      }
      
      message.error(errorMessage);
    }
  };

  // 分页后的数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 自动轮播逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 只有当NFT数量大于3时才启动自动轮播
    if (paginatedNFTs.length > 3 && isAutoPlaying) {
      intervalId = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % paginatedNFTs.length);
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paginatedNFTs.length, isAutoPlaying]);

  // 处理手动切换
  const handlePrev = () => {
    setIsAutoPlaying(false); // 暂停自动轮播
    setCurrentIndex(prevIndex => (prevIndex - 1 + paginatedNFTs.length) % paginatedNFTs.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false); // 暂停自动轮播
    setCurrentIndex(prevIndex => (prevIndex + 1) % paginatedNFTs.length);
  };

  // 计算要显示的NFT索引
  const getVisibleNFTs = () => {
    if (paginatedNFTs.length === 0) {
      return [];
    }
    
    if (paginatedNFTs.length <= 3) {
      // 如果NFT数量小于等于3，直接返回所有NFT
      return paginatedNFTs;
    }

    // 如果NFT数量大于3，才进行轮播
    const visibleNFTs = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % paginatedNFTs.length;
      visibleNFTs.push(paginatedNFTs[index]);
    }
    return visibleNFTs;
  };

  // 恢复自动轮播
  const resumeAutoPlay = () => {
    setIsAutoPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#1a1147]">
      <div className="container mx-auto px-4 py-8">
        {/* 添加数据状态指示器 */}
        <div className="mb-4 text-gray-400">
          {`当前显示 ${filteredNFTs.length} 个上架的NFT`}
        </div>
        
        {/* 顶部部分 - 限制度为屏幕的1/3 */}
        <div className="h-[33vh] relative">
          {/* 搜索框部分 */}
          <div className="container mx-auto px-6 pt-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  NFT市场
                </span>
              </h1>
              <div className="relative w-[300px]">
                <Input
                  placeholder="Search Products"
                  value={searchText}
                  onChange={(e: any) => setSearchText(e.target.value)}
                  className="w-full bg-[#231564] border border-[#3d2b85] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 使用新的 StepsGuide 组件 */}
          <StepsGuide />
        </div>

        {/* NFT列表部分 */}
        <div className="container mx-auto px-6 py-8">
          {paginatedNFTs.length === 0 ? (
            <div className="text-2xl text-gray-400 text-center">暂无在售NFT</div>
          ) : (
            <div className="relative">
              {/* 只有当NFT数量大于3时才显示导航按钮 */}
              {paginatedNFTs.length > 3 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/30 p-2 rounded-full"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/30 p-2 rounded-full"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* NFT展示区域 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                {getVisibleNFTs().map((nft) => (
                  <div
                    key={nft.id}
                    className="bg-[#231564] rounded-xl overflow-hidden border border-[#3d2b85] cursor-pointer transform transition-transform hover:scale-105 h-full"
                    onClick={() => openModal(nft)}
                  >
                    <div className="aspect-square w-full relative overflow-hidden">
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white mb-3">{nft.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400 text-lg font-medium">{getPriceById(nft.id)} ETH</span>
                        <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                          购买
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 购买确认弹窗 */}
        <Modal
          title={
            <div className="flex items-center space-x-2 p-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                确认购买
              </span>
            </div>
          }
          visible={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          width={500}
          className="purchase-modal"
          centered
          footer={null} // 移除默认 footer，使用自定义的
        >
          {selectedNft && (
            <div className="space-y-6 py-4">
              {/* NFT 预览 */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-[#3d2b85]">
                <img
                  src={selectedNft.image}
                  alt={selectedNft.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* NFT 信息 */}
              <div className="space-y-4 bg-[#231564] rounded-xl p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">{selectedNft.name}</h3>
                  <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-400 text-sm">
                    #{selectedNft.id}
                  </span>
                </div>

                {/* 添加账户余额显示 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>账户余额</span>
                  </div>
                  <div className="px-4 py-3 bg-[#1a1147] rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">当前余额</span>
                      <span className="text-lg font-bold text-purple-400">
                        {balance ? formatEther(balance.value) : '0'} ETH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>购买钱包地址</span>
                  </div>
                  <div className="px-4 py-3 bg-[#1a1147] rounded-lg break-all text-sm text-purple-400">
                    {connectedAddress}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#3d2b85]">
                  <span className="text-gray-400">价格</span>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <span className="text-xl font-bold text-white">{getPriceById(selectedNft.id)} ETH</span>
                  </div>
                </div>

                {/* 添加余额不足提示 */}
                {balance && selectedNft && 
                  parseFloat(formatEther(balance.value)) < parseFloat(getPriceById(selectedNft.id)) && (
                  <div className="px-4 py-2 bg-red-500/10 rounded-lg">
                    <p className="text-red-400 text-sm">
                      余额不足，请确保有足够的 ETH 完成购买
                    </p>
                  </div>
                )}
              </div>

              {/* 按钮组 */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#1a1147] text-gray-400 hover:bg-[#231564] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!connectedAddress || (balance && 
                    parseFloat(formatEther(balance.value)) < parseFloat(getPriceById(selectedNft.id)))}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold
                    ${!connectedAddress || (balance && 
                      parseFloat(formatEther(balance.value)) < parseFloat(getPriceById(selectedNft.id)))
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                    } text-white transition-all`}
                >
                  {!connectedAddress 
                    ? '请先连接钱包'
                    : balance && parseFloat(formatEther(balance.value)) < parseFloat(getPriceById(selectedNft.id))
                      ? '余额不足'
                      : '确认购买'
                  }
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* 添加全局样式 */}
        <style jsx global>{`
          .purchase-modal .ant-modal-content {
            background: #1a1147;
            border: 1px solid #3d2b85;
            border-radius: 1rem;
          }
          .purchase-modal .ant-modal-header {
            background: transparent;
            border-bottom: 1px solid #3d2b85;
          }
          .purchase-modal .ant-modal-close {
            color: #9ca3af;
          }
          .purchase-modal .ant-modal-close:hover {
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AllNFTs;
