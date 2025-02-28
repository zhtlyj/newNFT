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
import type { PaginationProps } from 'antd';

// 添加必要的类型定义
interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface NFTInfo {
  id: number;
  name: string;
  description: string;
  image: string;
  owner: string;
  price: string;
  isListed: boolean;
  attributes: NFTAttribute[];
  CID?: string;
}

interface Collectible {
  id: number;
  name: string;
  description: string;
  image: string;
  owner: string;
  price: string;
  attributes: NFTAttribute[];
  CID?: string;
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
  const itemsPerPage = 8;
  const [ownedNFTs, setOwnedNFTs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest"); // 排序方式
  const [filterAttribute, setFilterAttribute] = useState<string>("all"); // 属性过滤
  const [isHighPerformance, setIsHighPerformance] = useState(false);

  const { writeAsync: purchase } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [] as const, // 添加空的 args 数组作为默认值
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

      // 添加类型断言
      const uniqueListedNFTs = Array.from(
        new Map(
          data.nfts
            .filter((nft: any) => {
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
            .map((nft: Collectible) => [nft.id, nft])
        ).values()
      ) as Collectible[];

      if (uniqueListedNFTs.length > 0) {
        setAllNFTs(uniqueListedNFTs);
        setFilteredNFTs(uniqueListedNFTs);
        
        const priceInfo = uniqueListedNFTs.map(nft => ({
          id: nft.id,
          price: nft.price
        }));
        setListedNFTs(priceInfo);
      } else {
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

  // 修改排序和过滤函数
  const getSortedAndFilteredNFTs = (nfts: Collectible[]) => {
    let result = [...nfts];

    // 先进行排序
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;
      case "oldest":
        result.sort((a, b) => a.id - b.id);
        break;
      case "priceHighToLow":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "priceLowToHigh":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      default:
        break;
    }

    // 如果选择了"全部"，直接返回排序后的结果
    if (filterAttribute === "all") {
      return result;
    }

    // 否则进行属性过滤
    return result.filter(nft => 
      nft.attributes.some(attr => 
        attr.value.toLowerCase() === filterAttribute.toLowerCase()
      )
    );
  };

  // 修改搜索处理函数
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === "") {
      setFilteredNFTs(getSortedAndFilteredNFTs(allNFTs));
    } else {
      const searchTerms = value.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      const filtered = allNFTs.filter((nft) => {
        // 检查名称
        const nameMatch = searchTerms.some(term => 
          nft.name.toLowerCase().includes(term)
        );
        
        // 检查描述
        const descriptionMatch = searchTerms.some(term => 
          nft.description.toLowerCase().includes(term)
        );
        
        // 检查属性
        const attributesMatch = nft.attributes.some(attr => 
          searchTerms.some(term => 
            attr.trait_type.toLowerCase().includes(term) || 
            attr.value.toLowerCase().includes(term)
          )
        );
        
        // 检查价格范围（如果搜索词是数字）
        const priceMatch = searchTerms.some(term => {
          const numTerm = parseFloat(term);
          if (!isNaN(numTerm)) {
            const nftPrice = parseFloat(nft.price);
            return !isNaN(nftPrice) && Math.abs(nftPrice - numTerm) <= 0.1; // 允许0.1 ETH的误差
          }
          return false;
        });

        return nameMatch || descriptionMatch || attributesMatch || priceMatch;
      });

      setFilteredNFTs(getSortedAndFilteredNFTs(filtered));
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 修改 useEffect 中的搜索逻辑
  useEffect(() => {
    handleSearch(searchText);
  }, [searchText, allNFTs]); // 依赖项保持不变

  // 添加一个统一的消息提示函数
  const showCustomMessage = (content: string) => {
    notification.info({
      message: content,
      className: 'custom-notification',
      style: {
        background: '#231564',
        border: '1px solid #3d2b85',
        borderRadius: '8px',
      },
      messageStyle: {
        color: '#fff',
      },
    });
  };

  // 修改 openModal 函数
  const openModal = (nft: Collectible) => {
    // 检查是否已拥有该 NFT
    if (ownedNFTs.includes(nft.id)) {
      showCustomMessage('您已拥有该 NFT');
      return;
    }
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
      // 检查是否已拥有该 NFT
      if (ownedNFTs.includes(selectedNft.id)) {
        message.info({
          content: '您已拥有该 NFT',
          className: 'custom-message',
          style: {
            background: '#231564',
            border: '1px solid #3d2b85',
            borderRadius: '8px',
            color: '#fff',
          },
        });
        setIsModalOpen(false);
        return;
      }

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

        if (result) {
          hide();

          // 更新NFT状态
          await updateNFTAfterPurchase(selectedNft.id, connectedAddress);

          // 显示成功消息
          notification.success({
            message: 'NFT购买成功',
            description: (
              <div className="flex flex-col gap-2">
                <div className="text-green-400">NFT已成功转移到您的账户</div>
                <div className="success-checkmark">
                  <div className="check-icon">
                    <span className="icon-line line-tip"></span>
                    <span className="icon-line line-long"></span>
                    <div className="icon-circle"></div>
                    <div className="icon-fix"></div>
                  </div>
                </div>
              </div>
            ),
            className: 'purchase-success-notification',
            duration: 4,
            placement: 'top',
            style: {
              background: 'rgba(35, 21, 100, 0.95)',
              borderLeft: '4px solid #10B981',
              backdropFilter: 'blur(10px)',
            }
          });

          setIsModalOpen(false);

          // 添加延迟以确保数据库更新完成
          setTimeout(async () => {
            // 重新获取所有数据
            await Promise.all([
              fetchListedNFTs(),  // 获取最新的上架NFT列表
              fetchOwnedNFTs(),   // 更新用户拥有的NFT列表
            ]);

            // 重置分页到第一页
            setCurrentPage(1);

            // 重新应用当前的搜索和过滤条件
            const updatedFiltered = getSortedAndFilteredNFTs(allNFTs);
            setFilteredNFTs(updatedFiltered);
          }, 1000); // 1秒延迟
        }
      } catch (error) {
        hide();
        throw error;
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
      
      message.error({
        content: errorMessage,
        className: 'custom-message',
        style: {
          background: '#231564',
          border: '1px solid #3d2b85',
          borderRadius: '8px',
          color: '#fff',
        },
      });
    }
  };

  // 分页后的数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 添加获取用户拥有的 NFT 函数
  const fetchOwnedNFTs = async () => {
    if (!connectedAddress) {
      setOwnedNFTs([]);
      return;
    }

    try {
      const response = await fetch(`/api/Nft/owner?address=${connectedAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        // 提取所有拥有的 NFT 的 ID
        const ownedIds = data.nfts.map((nft: NftInfo) => nft.id);
        setOwnedNFTs(ownedIds);
      } else {
        setOwnedNFTs([]);
      }
    } catch (error) {
      console.error('获取拥有的NFT失败:', error);
      setOwnedNFTs([]);
    }
  };

  // 在 useEffect 中调用
  useEffect(() => {
    fetchOwnedNFTs();
  }, [connectedAddress]);

  // 修改 notification.config 的类型问题
  useEffect(() => {
    notification.config({
      placement: 'topRight',
      duration: 3,
    });
  }, []);

  // 修改 message 组件的使用
  const showMessage = (type: 'info' | 'error' | 'success', content: string) => {
    message[type]({
      content,
      className: 'custom-message',
      style: {
        background: '#231564',
        border: '1px solid #3d2b85',
        borderRadius: '8px',
        color: '#fff',
      },
    });
  };

  // 修改 FilterAndSort 组件
  const FilterAndSort = () => {
    return (
      <div className="flex flex-wrap gap-4 mb-6">
        {/* 排序选项 */}
        <div className="flex items-center space-x-2">
          <span className="text-white">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              const sorted = getSortedAndFilteredNFTs(allNFTs);
              setFilteredNFTs(sorted);
            }}
            className="bg-[#231564] text-white border border-[#3d2b85] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="newest">最新</option>
            <option value="oldest">最早</option>
            <option value="priceHighToLow">价格从高到低</option>
            <option value="priceLowToHigh">价格从低到高</option>
          </select>
        </div>

        {/* 属性过滤 */}
        <div className="flex items-center space-x-2">
          <span className="text-white">全部:</span>
          <select
            value={filterAttribute}
            onChange={(e) => {
              setFilterAttribute(e.target.value);
              const filtered = getSortedAndFilteredNFTs(allNFTs);
              setFilteredNFTs(filtered);
            }}
            className="bg-[#231564] text-white border border-[#3d2b85] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">全部</option>
            <option value="Art">艺术</option>
            <option value="Music">音乐</option>
            <option value="Trading Cards">交易卡</option>
            <option value="Virtual world">虚拟世界</option>
            <option value="Doodles">涂鸦</option>
            <option value="Sports">体育</option>
            <option value="Photography">摄影</option>
            <option value="Utility">实用工具</option>
          </select>
        </div>

        {/* 显示结果数量 */}
        <div className="text-gray-400 ml-auto">
          找到 {filteredNFTs.length} 个NFT
        </div>
      </div>
    );
  };

  // 添加 useEffect 来监听排序和过滤条件的变化
  useEffect(() => {
    if (allNFTs.length > 0) {
      const filtered = getSortedAndFilteredNFTs(allNFTs);
      setFilteredNFTs(filtered);
    }
  }, [sortBy, filterAttribute, allNFTs]);

  // 添加导航箭头处理函数
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(filteredNFTs.length / itemsPerPage);
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
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
                  className="w-full bg-[#231564] border border-[#3d2b85] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500 pl-10"
                  style={{ 
                    color: '#fff', // 设置输入文字颜色
                    caretColor: '#fff', // 设置光标颜色
                  }}
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

        {/* 添加分类控制组件 */}
        <div className="container mx-auto px-6 py-4">
          <FilterAndSort />
        </div>

        {/* NFT列表部分 */}
        <div className="container mx-auto px-6 py-8">
          {paginatedNFTs.length === 0 ? (
            <div className="text-2xl text-gray-400 text-center">暂无在售NFT</div>
          ) : (
            <>
              {/* NFT展示区域 */}
              <div className="relative">
                {/* 左箭头 */}
                {currentPage > 1 && (
                  <button
                    onClick={handlePrevPage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 p-3 rounded-full bg-[#231564]/80 border border-[#3d2b85] hover:bg-[#231564] transition-all hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <svg
                      className="w-6 h-6 text-white/80 hover:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                )}

                {/* 右箭头 */}
                {currentPage < Math.ceil(filteredNFTs.length / itemsPerPage) && (
                  <button
                    onClick={handleNextPage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 p-3 rounded-full bg-[#231564]/80 border border-[#3d2b85] hover:bg-[#231564] transition-all hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <svg
                      className="w-6 h-6 text-white/80 hover:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}

                {/* NFT 展示区域 */}
                <div className="grid grid-cols-4 gap-8 px-6 max-w-[1600px] mx-auto">
                  {paginatedNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className="bg-[#231564] rounded-xl overflow-hidden border border-[#3d2b85] cursor-pointer float-card relative"
                      onClick={() => openModal(nft)}
                    >
                      {ownedNFTs.includes(nft.id) && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <div className="bg-purple-500/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-bl-md scan-effect">
                            已拥有
                          </div>
                        </div>
                      )}
                      
                      <div className="aspect-square w-full relative hologram-effect">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white mb-4 truncate neon-text">{nft.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 text-lg font-medium matrix-rain">{getPriceById(nft.id)} ETH</span>
                          <button 
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 energy-pulse"
                          >
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                              />
                            </svg>
                            <span>购买</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分页控件 - 修改样式和位置 */}
              {filteredNFTs.length > itemsPerPage && (
                <div className="mt-12 flex justify-center">
                  <Pagination
                    current={currentPage}
                    total={filteredNFTs.length}
                    pageSize={itemsPerPage}
                    onChange={handlePageChange}
                    className="custom-pagination"
                    showSizeChanger={false} // 隐藏页码选择器
                    showQuickJumper={false} // 隐藏快速跳转
                    showTotal={(total) => `共 ${total} 个`} // 显示总数
                  />
                </div>
              )}
            </>
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

        {/* 性能模式切换按钮 */}
        <button 
          className="performance-toggle"
          onClick={togglePerformanceMode}
        >
          {isHighPerformance ? '切换到普通模式' : '切换到高性能模式'}
        </button>
        
        {/* 性能模式指示器 */}
        <div className="performance-indicator">
          {isHighPerformance ? '高性能模式' : '普通模式'}
        </div>
      </div>
    </div>
  );
};

export default AllNFTs;
