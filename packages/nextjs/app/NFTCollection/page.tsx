"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification } from "antd";
import type { ReactNode } from "react";

interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  CID?: string;
  isListed: boolean;
}

const NFTCollection: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortType, setSortType] = useState<string>('newest');
  const [isFirstLoading, setIsFirstLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]); // 修改初始最大值为 100
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldPoll, setShouldPoll] = useState(true);
  const [isHighPerformance, setIsHighPerformance] = useState(false);

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 将通知配置和函数移到组件内部
  useEffect(() => {
    // 配置通知样式
    notification.config({
      placement: 'topRight',
      duration: 3,
      style: {
        background: '#231564',
        border: '1px solid #3d2b85',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    });
  }, []); // 只在组件挂载时执行一次

  // 修改通知函数
  const showNotification = (type: 'success' | 'info' | 'error', title: string, message: string) => {
    notification[type]({
      message: <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>{title}</span>,
      description: <span style={{ color: '#ffffff', opacity: 0.9 }}>{message}</span>,
      style: {
        background: '#231564',
        border: '1px solid #3d2b85',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
      },
      className: 'dark-theme-notification',
      closeIcon: (
        <div className="text-white/60 hover:text-white/90 transition-colors duration-200 text-lg">
          ×
        </div>
      ),
      icon: (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full 
          ${type === 'success' ? 'bg-green-500' : 
            type === 'info' ? 'bg-blue-500' : 
            'bg-red-500'}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            className="w-5 h-5"
          >
            {type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : type === 'info' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </div>
      ),
    });
  };

  // 添加全局样式
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .dark-theme-notification {
        background: #231564 !important;
        border: 1px solid #3d2b85 !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4) !important;
      }

      .dark-theme-notification .ant-notification-notice-message {
        color: white !important;
        font-weight: 600 !important;
        font-size: 16px !important;
        margin-bottom: 4px !important;
      }

      .dark-theme-notification .ant-notification-notice-description {
        color: rgba(255, 255, 255, 0.85) !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }

      .dark-theme-notification .ant-notification-notice {
        padding: 16px !important;
      }

      .dark-theme-notification .ant-notification-notice-icon {
        margin-top: 4px !important;
      }

      .dark-theme-notification .ant-notification-notice-close {
        top: 16px !important;
        right: 16px !important;
      }

      .dark-theme-notification .ant-notification-notice-with-icon .ant-notification-notice-message, 
      .dark-theme-notification .ant-notification-notice-with-icon .ant-notification-notice-description {
        margin-left: 48px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 修改 fetchNFTs 函数，添加上一个地址的引用
  const previousAddressRef = useRef<string | undefined>();

  const fetchNFTs = async () => {
    try {
      if (isFirstLoading) {
        setIsLoading(true);
      }

      if (!connectedAddress) {
        setCreatedNFTs([]);
        setShouldPoll(false);
        return;
      }

      // 检查是否是地址切换
      const isAddressChanged = previousAddressRef.current && previousAddressRef.current !== connectedAddress;
      previousAddressRef.current = connectedAddress;

      const response = await fetch(`/api/Nft/owner?address=${connectedAddress}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          // 只在非地址切换且有之前的 NFT 数据时显示通知
          if (!isAddressChanged && createdNFTs.length > 0) {
            showNotification(
              'info',
              'NFT #33 已下架',
              '下架成功'
            );
          }
          setCreatedNFTs([]);
          setShouldPoll(false);
          return;
        }
        throw new Error(data.message || '获取NFT数据失败');
      }

      setShouldPoll(true);
      setCreatedNFTs(data.nfts);
      
    } catch (error) {
      console.error('获取NFT数据出错:', error);
      setCreatedNFTs([]);
    } finally {
      if (isFirstLoading) {
        setIsFirstLoading(false);
        setIsLoading(false);
      }
    }
  };

  // 组件加载时获取数据，并定期刷新
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initFetch = async () => {
      if (connectedAddress) {
        await fetchNFTs();
        if (shouldPoll) {
          intervalId = setInterval(fetchNFTs, 30000);
        }
      } else {
        setCreatedNFTs([]);
        setShouldPoll(false);
        setIsFirstLoading(true);
      }
    };

    initFetch();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [connectedAddress, shouldPoll]);

  const filteredNFTs = useMemo(() => {
    let filtered = [...createdNFTs];
    
    // 根据上架状态过滤
    if (selectedType === 'Listed') {
      filtered = filtered.filter(nft => nft.isListed);
    } else if (selectedType === 'Not Listed') {
      filtered = filtered.filter(nft => !nft.isListed);
    }
    // 'All' 类型不需要过滤，显示所有 NFT

    // 其他过滤条件保持不变
    if (selectedCategory) {
      filtered = filtered.filter(nft => 
        nft.attributes.some(attr => 
          attr.trait_type === 'category' && attr.value === selectedCategory
        )
      );
    }

    // 添加价格范围过滤
    filtered = filtered.filter(nft => {
      const price = parseFloat(nft.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // 添加搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(term) || 
        nft.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [createdNFTs, selectedType, selectedCategory, priceRange, searchTerm]);

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

  // 处理价格范围变化
  const handlePriceRangeChange = (value: number, index: number) => {
    setPriceRange(prev => {
      const newRange = [...prev] as [number, number];
      newRange[index] = value;
      // 确保最小值不大于最大值
      if (index === 0 && value > newRange[1]) {
        newRange[1] = value;
      }
      // 确保最大值不小于最小值
      if (index === 1 && value < newRange[0]) {
        newRange[0] = value;
      }
      return newRange as [number, number];
    });
  };

  // 从 localStorage 加载性能模式设置
  useEffect(() => {
    const savedMode = localStorage.getItem('performanceMode');
    if (savedMode) {
      setIsHighPerformance(savedMode === 'high');
    }
  }, []);

  // 切换性能模式
  const togglePerformanceMode = () => {
    const newMode = !isHighPerformance;
    setIsHighPerformance(newMode);
    localStorage.setItem('performanceMode', newMode ? 'high' : 'normal');
  };

  return (
    <div className={`min-h-screen bg-[#1a1147] transition-performance ${!isHighPerformance ? 'normal-mode' : ''}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 搜索框 - 进一步减小尺寸 */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-white mb-1.5">Search</h1>
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search Products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {['All', 'Listed', 'Not Listed'].map((type) => (
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
              <div className="px-4 space-y-4">
                {/* 最小值滑块 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Min Price</span>
                    <span>{priceRange[0]} ETH</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(parseFloat(e.target.value), 0)}
                    className="w-full h-2 bg-[#231564] rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                
                {/* 最大值滑块 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Max Price</span>
                    <span>{priceRange[1]} ETH</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(parseFloat(e.target.value), 1)}
                    className="w-full h-2 bg-[#231564] rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* 价格范围显示 */}
                <div className="flex justify-between items-center py-2">
                  <div className="px-3 py-1 bg-[#231564] rounded-lg text-white text-sm">
                    {priceRange[0]} ETH
                  </div>
                  <div className="h-[2px] flex-1 mx-2 bg-[#231564]">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${((priceRange[1] - priceRange[0]) / 100) * 100}%`,
                        marginLeft: `${(priceRange[0] / 100) * 100}%`
                      }}
                    />
                  </div>
                  <div className="px-3 py-1 bg-[#231564] rounded-lg text-white text-sm">
                    {priceRange[1]} ETH
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

              {/* NFT列表区域 */}
              <div className="bg-[#1a1147]/50 rounded-lg p-4">
                {!connectedAddress ? (
                  // 未连接钱包时显示提示
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <svg 
                      className="w-16 h-16 mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">请连接钱包</h3>
                    <p className="text-gray-500">连接钱包后即可查看您的 NFT 收藏</p>
                  </div>
                ) : isFirstLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                ) : createdNFTs.length === 0 ? (
                  // 钱包中没有任何 NFT 时显示
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <svg 
                      className="w-16 h-16 mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">暂无 NFT</h3>
                    <p className="text-gray-500">您的钱包中还没有 NFT，快去创建或购买吧！</p>
                  </div>
                ) : sortedNFTs.length === 0 ? (
                  // 有 NFT 但当前筛选条件下没有匹配项时显示
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <svg 
                      className="w-16 h-16 mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">未找到匹配的 NFT</h3>
                    <p className="text-gray-500">当前筛选条件下没有匹配的 NFT</p>
                  </div>
                ) : (
                  <MyHoldings filteredNFTs={sortedNFTs} onNFTUpdate={fetchNFTs} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 添加性能模式切换按钮 */}
      <button 
        className="performance-toggle"
        onClick={togglePerformanceMode}
      >
        {isHighPerformance ? '切换到普通模式' : '切换到高性能模式'}
      </button>
      
      {/* 添加性能模式指示器 */}
      <div className="performance-indicator">
        {isHighPerformance ? '高性能模式' : '普通模式'}
      </div>
    </div>
  );
};

export default NFTCollection;
