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
import axios from "axios";

interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  description: string;
  Shelves: number;
  CID: string;
  PurchasePrice: string;
}

interface ListedNftInfo {
  id: number;
  price: string;
  PurchasePrice: string;
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

  // 从数据库获取 NFT 数据
  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const [ listedNFTsResponse] = await Promise.all([
          axios.get('http://localhost:4000/getNftsli')
        ]);

        // 格式化 NFT 数据，确保包含 PurchasePrice
        const formattedNFTs = listedNFTsResponse.data.nfts.map((nft: any) => ({
          id: nft.nft_id,
          name: nft.nft_name,
          image: nft.nft_image,
          description: nft.description,
          owner: nft.owner?.toLowerCase(),
          CID: nft.CID,
          Shelves: nft.Shelves,
          PurchasePrice: nft.PurchasePrice // 确保包含 PurchasePrice
        }));

        console.log("Formatted NFTs:", formattedNFTs); // 调试日志
        setAllNFTs(formattedNFTs);
        setFilteredNFTs(formattedNFTs);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    };

    fetchNFTs();
  }, []);

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

  const openModal = (nft: any) => {
    console.log("Opening modal with NFT:", nft); // 调试日志
    setSelectedNft({
      ...nft,
      PurchasePrice: nft.PurchasePrice // 确保包含 PurchasePrice
    });
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPriceById = (id: number) => {
    const listedNft = listedNFTs.find(nft => nft.id === id);
    if (!listedNft) return "N/A";
    
    // 确保价格存在且有效
    if (!listedNft.price || listedNft.price === "0") {
      return "N/A";
    }
    
    return listedNft.price;
  };

  const handlePurchase = async () => {
    if (!selectedNft || !connectedAddress) return;

    try {
      // 使用 PurchasePrice 作为购买价格
      const price = selectedNft.PurchasePrice;
      
      if (!selectedNft.owner) {
        notification.error({ message: "NFT所有者地址无效" });
        return;
      }

      const priceInWei = parseEther(price);
      
      if (balance && balance.value < priceInWei) {
        notification.error({ message: "余额不足" });
        return;
      }

      const ownerAddress = selectedNft.owner.toLowerCase();
      
      // 调用合约
      const tx = await purchase({
        args: [
          BigInt(selectedNft.id),
          ownerAddress,
          priceInWei
        ],
        value: priceInWei,
      });

      await tx.wait();

      // 使用 /guomai 接口更新 NFT 状态
      await axios.put('http://localhost:4000/guomai', {
        nft_id: selectedNft.id,
        owner: connectedAddress, // 新的所有者
        shelvesValue: 0 // 购买后自动下架
      });

      // 重新获取最新数据
      const [allNFTsResponse, listedNFTsResponse] = await Promise.all([
        axios.get('http://localhost:4000/getNfts'),
        axios.get('http://localhost:4000/getNftsli')
      ]);

      // 更新所有 NFTs
      const updatedNFTs = allNFTsResponse.data.nfts.map((nft: any) => ({
        image: nft.nft_image,
        id: nft.nft_id,
        name: nft.nft_name,
        attributes: nft.attributes,
        owner: nft.owner?.toLowerCase(),
        description: nft.description,
        Shelves: nft.Shelves, 
        PurchasePrice: nft.PurchasePrice,
        CID: nft.CID
      }));
      setAllNFTs(updatedNFTs);
      setFilteredNFTs(updatedNFTs);

      // 更新已上架的 NFTs
      const updatedListedNFTs = listedNFTsResponse.data.nfts.map((nft: any) => ({
        id: nft.nft_id,
        price: nft.price
      }));
      setListedNFTs(updatedListedNFTs);

      notification.success({ 
        message: "购买成功",
        description: "NFT已转移到您的账户"
      });

      setIsModalOpen(false);

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

      notification.error({ 
        message: errorMessage,
        description: error instanceof Error ? error.message : "未知错误"
      });
    }
  };

  // 分页后的数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 自动轮播逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 只有当items长度大于3时才启动自动轮播
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
    if (paginatedNFTs.length <= 3) {
      // 如果NFT数量少于等于3，直接显示所有
      return paginatedNFTs;
    }

    // 否则显示当前索引及其后两个NFT
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
          <NFTCarousel
            nfts={getVisibleNFTs()}
            onOpenModal={openModal}
            getPriceById={getPriceById}
            connectedAddress={connectedAddress}
          />
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
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-[#3d2b85]">
              <img
                src={selectedNft.image}
                alt={selectedNft.name}
                className="w-full h-full object-cover"
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
                  <span className="text-xl font-bold text-white">
                    {selectedNft.PurchasePrice} ETH
                  </span>
                </div>
              </div>

              {balance && selectedNft && 
                parseFloat(formatEther(balance.value)) < parseFloat(selectedNft.PurchasePrice) && (
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
                  parseFloat(formatEther(balance.value)) < parseFloat(selectedNft.PurchasePrice))}
                className={`flex-1 px-6 py-3 rounded-xl font-bold
                  ${!connectedAddress || (balance && 
                    parseFloat(formatEther(balance.value)) < parseFloat(selectedNft.PurchasePrice))
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                  } text-white transition-all`}
              >
                {!connectedAddress 
                  ? '请先连接钱包'
                  : balance && parseFloat(formatEther(balance.value)) < parseFloat(selectedNft.PurchasePrice)
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
  );
};

export default AllNFTs;
