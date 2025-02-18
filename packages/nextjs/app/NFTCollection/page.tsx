"use client";

import { useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  CID?: string;
}

const NFTCollection: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Buy Now');
  const [sortType, setSortType] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState(true);

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 从数据库获取 NFT 数据
  const fetchNFTs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/Nft');
      
      if (!response.ok) {
        throw new Error('获取NFT数据失败');
      }

      const data = await response.json();
      console.log('从数据库获取的NFT数据:', data);
      
      if (data.nfts) {
        setCreatedNFTs(data.nfts);
      }
    } catch (error) {
      console.error('获取NFT数据出错:', error);
      notification.error(error instanceof Error ? error.message : "获取NFT数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchNFTs();
  }, [connectedAddress]); // 当地址改变时重新获取

  const filteredNFTs = useMemo(() => {
    let filtered = [...createdNFTs];
    
    if (selectedCategory) {
      filtered = filtered.filter(nft => 
        nft.attributes.some(attr => 
          attr.trait_type === 'category' && attr.value === selectedCategory
        )
      );
    }

    if (selectedType === 'Buy Now') {
      filtered = filtered.filter(nft => nft.price !== '');
    }

    return filtered;
  }, [createdNFTs, selectedCategory, selectedType]);

  // 排序函数
  const sortedNFTs = useMemo(() => {
    let sorted = [...filteredNFTs];
    
    switch (sortType) {
      case 'newest':
        sorted.sort((a, b) => b.id - a.id);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.id - b.id);
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceA - priceB;
        });
        break;
      default:
        break;
    }
    
    return sorted;
  }, [filteredNFTs, sortType]);

  // 计算总价值
  const calculateTotalValue = (nfts: NftInfo[]) => {
    return nfts.reduce((acc, nft) => {
      const price = parseFloat(nft.price) || 0;
      return acc + price;
    }, 0).toFixed(2); // 保留两位小数
  };

  // 格式化价格显示
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'NaN' : numPrice.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#1a1147]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 搜索框 - 进一步减小尺寸 */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-white mb-1.5">Search</h1>
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search Products"
              className="w-full bg-[#231564] border border-[#3d2b85] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 pl-8"
            />
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
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

        <div className="flex gap-8">
          {/* 左侧分类过滤器 */}
          <div className="w-64 flex-shrink-0">
            {/* NFT Category */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#9d8ec4] mb-4">NFT Category</h2>
              <div className="space-y-1">
                {['Art', 'Music', 'Trading Cards', 'Virtual world', 'Doodles', 'Sports', 'Photography', 'Utility'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === selectedCategory ? '' : category)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center space-x-2
                      ${selectedCategory === category 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:bg-[#231564]'}`}
                  >
                    <span className="flex-1">{category}</span>
                    {selectedCategory === category && (
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* NFT Type */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#9d8ec4] mb-4">NFT Type</h2>
              <div className="space-y-1">
                {['Buy Now', 'Has Offers', 'On Auction'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type === selectedType ? '' : type)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center space-x-2
                      ${selectedType === type 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:bg-[#231564]'}`}
                  >
                    <span className="flex-1">{type}</span>
                    {selectedType === type && (
                      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter By Price */}
            <div>
              <h2 className="text-2xl font-bold text-[#9d8ec4] mb-4">Filter By Price</h2>
              <div className="px-4">
                <div className="w-full h-1 bg-[#231564] rounded-full">
                  <div className="w-1/2 h-full bg-purple-500 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-400">0 ETH</span>
                  <span className="text-gray-400">10 ETH</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1">
            {/* 统计信息卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#231564] rounded-xl p-4 border border-[#3d2b85]">
                <h3 className="text-gray-400 text-sm mb-1">Total NFTs</h3>
                <p className="text-2xl font-bold text-white">
                  {filteredNFTs.length}
                </p>
              </div>
              <div className="bg-[#231564] rounded-xl p-4 border border-[#3d2b85]">
                <h3 className="text-gray-400 text-sm mb-1">Total Value</h3>
                <p className="text-2xl font-bold text-white">
                  {calculateTotalValue(filteredNFTs)} ETH
                </p>
              </div>
              <div className="bg-[#231564] rounded-xl p-4 border border-[#3d2b85]">
                <h3 className="text-gray-400 text-sm mb-1">Unique Collections</h3>
                <p className="text-2xl font-bold text-white">
                  {new Set(filteredNFTs.map(nft => nft.attributes[0]?.value)).size}
                </p>
              </div>
            </div>

            {/* NFT展示区域 */}
            <div className="bg-[#231564] rounded-xl p-6 border border-[#3d2b85]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {selectedCategory ? `${selectedCategory} NFTs` : 'All NFTs'}
                </h2>
                <select 
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="bg-[#1a1147] border border-[#3d2b85] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price High to Low</option>
                  <option value="price-low">Price Low to High</option>
                </select>
              </div>

              {/* NFT列表 - 添加加载状态 */}
              <div className="bg-[#1a1147]/50 rounded-lg p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                ) : sortedNFTs.length > 0 ? (
                  <MyHoldings filteredNFTs={sortedNFTs} />
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    暂无NFT数据
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCollection;
