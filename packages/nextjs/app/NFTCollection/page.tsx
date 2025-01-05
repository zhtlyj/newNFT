"use client";

import { useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import axios from "axios";

interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  Shelves: number;
  PurchasePrice: string;
  CID?: string;
}

const NFTCollection: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Buy Now');
  const [sortType, setSortType] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        // 获取所有 NFTs
        const response = await axios.get(`http://localhost:4000/getMyNfts/${connectedAddress}`);
        const nfts = response.data.nfts.map((nft: any) => ({
          image: nft.nft_image,
          id: nft.nft_id,
          name: nft.nft_name,
          attributes: nft.attributes,
          owner: nft.owner,
          price: nft.price,
          description: nft.description,
          Shelves: nft.Shelves,
          PurchasePrice: nft.PurchasePrice,
          CID: nft.CID
        }));
        setCreatedNFTs(nfts);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    };

    fetchNFTs();
  }, [connectedAddress]);

  const filteredNFTs = useMemo(() => {
    let filtered = [...createdNFTs];
    
    if (selectedCategory) {
      filtered = filtered.filter(nft => {
        const categoryAttribute = nft.attributes?.find(
          (attr: any) => attr.trait_type === 'category'
        );
        return categoryAttribute?.value === selectedCategory;
      });
    }

    if (selectedType === 'Buy Now') {
      filtered = filtered.filter(nft => nft.price !== '');
    }

    filtered = filtered.filter(nft => {
      const price = parseFloat(nft.price) || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    return filtered;
  }, [createdNFTs, selectedCategory, selectedType, priceRange]);

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

  // 新增：计算可用的分类
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    createdNFTs.forEach(nft => {
      const category = nft.attributes.find(attr => attr.trait_type === 'category')?.value;
      if (category) {
        categories.add(category);
      }
    });
    return Array.from(categories);
  }, [createdNFTs]);

  // 添加搜索处理函数
  const handleSearch = async (value: string) => {
    try {
      if (value.trim()) {
        const response = await axios.get(`http://localhost:4000/NftSearch/${encodeURIComponent(value)}`);
        const searchResults = response.data.map((nft: any) => ({
          image: nft.nft_image,
          id: nft.nft_id,
          name: nft.nft_name,
          attributes: nft.attributes,
          owner: nft.owner,
          price: nft.price,
          description: nft.description,
          Shelves: nft.Shelves,
          PurchasePrice: nft.PurchasePrice,
          CID: nft.CID
        }));
        setCreatedNFTs(searchResults);
      } else {
        // 如果搜索框为空，重新获取所有NFTs
        const response = await axios.get(`http://localhost:4000/getMyNfts/${connectedAddress}`);
        const nfts = response.data.nfts.map((nft: any) => ({
          image: nft.nft_image,
          id: nft.nft_id,
          name: nft.nft_name,
          attributes: nft.attributes,
          owner: nft.owner,
          price: nft.price,
          description: nft.description,
          Shelves: nft.Shelves,
          PurchasePrice: nft.PurchasePrice,
          CID: nft.CID
        }));
        setCreatedNFTs(nfts);
      }
    } catch (error) {
      console.error("Error searching NFTs:", error);
    }
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
  };

  return (
    <div className="min-h-screen bg-[#1a1147]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 搜索框 */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-white mb-1.5">Search</h1>
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search Products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchTerm);
                }
              }}
              className="w-full bg-[#231564] border border-[#3d2b85] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 pl-8"
            />
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 cursor-pointer"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              onClick={() => handleSearch(searchTerm)}
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
                {availableCategories.map((category) => (
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
                <div className="space-y-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={priceRange.max}
                    onChange={(e) => handlePriceRangeChange(priceRange.min, parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#231564] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <div className="flex justify-between">
                    <input
                      type="number"
                      min="0"
                      max={priceRange.max}
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange(parseFloat(e.target.value), priceRange.max)}
                      className="w-20 bg-[#231564] border border-[#3d2b85] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="number"
                      min={priceRange.min}
                      max="100"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange(priceRange.min, parseFloat(e.target.value))}
                      className="w-20 bg-[#231564] border border-[#3d2b85] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
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

              {/* NFT列表 - 使用排序后的数据 */}
              <div className="bg-[#1a1147]/50 rounded-lg p-4">
                <MyHoldings filteredNFTs={sortedNFTs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCollection;
