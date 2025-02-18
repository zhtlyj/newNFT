"use client";

import { useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useNetwork } from "wagmi";

const TransactionHistory: NextPage = () => {
  const [glowEffect, setGlowEffect] = useState(false);
  const { chain } = useNetwork();

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowEffect(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Mantle Sepolia 的事件
  const { data: mantleTransferEvents, isLoading: isMantleTransferLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Transfer",
    fromBlock: BigInt(16327060),
    enabled: chain?.id === 5003,
  });

  const { data: mantlePurchaseEvents, isLoading: isMantlePurchaseLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "PurchaseNFT",
    fromBlock: BigInt(16327060),
    enabled: chain?.id === 5003,
  });

  // Sepolia 的事件
  const { data: sepoliaTransferEvents, isLoading: isSepoliaTransferLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Transfer",
    fromBlock: BigInt(0),
    enabled: chain?.id === 11155111,
  });

  const { data: sepoliaPurchaseEvents, isLoading: isSepoliaPurchaseLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "PurchaseNFT",
    fromBlock: BigInt(0),
    enabled: chain?.id === 11155111,
  });

  // 根据当前网络合并事件
  const allEvents = useMemo(() => {
    const currentTransferEvents = chain?.id === 5003 ? mantleTransferEvents : sepoliaTransferEvents;
    const currentPurchaseEvents = chain?.id === 5003 ? mantlePurchaseEvents : sepoliaPurchaseEvents;

    const events = [
      ...(currentTransferEvents || []).map(event => ({
        ...event,
        type: 'Transfer',
        displayName: '转移',
      })),
      ...(currentPurchaseEvents || []).map(event => ({
        ...event,
        type: 'Purchase',
        displayName: '购买',
      })),
    ];

    return events.sort((a, b) => {
      const timeA = Number(a.block?.timestamp || 0);
      const timeB = Number(b.block?.timestamp || 0);
      return timeB - timeA;
    });
  }, [chain?.id, mantleTransferEvents, mantlePurchaseEvents, sepoliaTransferEvents, sepoliaPurchaseEvents]);

  const isLoading = chain?.id === 5003 
    ? (isMantleTransferLoading || isMantlePurchaseLoading)
    : (isSepoliaTransferLoading || isSepoliaPurchaseLoading);

  // 获取事件类型的显示文本
  const getEventTypeDisplay = (event: any) => {
    if (event.type === 'Transfer') {
      // 如果是铸造（from 地址为零地址）
      if (event.args.from === '0x0000000000000000000000000000000000000000') {
        return <span className="text-green-400">铸造</span>;
      }
      return <span className="text-blue-400">转移</span>;
    }
    if (event.type === 'Purchase') {
      return <span className="text-purple-400">购买</span>;
    }
    return <span className="text-gray-400">未知</span>;
  };

  const getExplorerUrl = (blockNumber: number | bigint) => {
    if (chain?.id === 5003) {
      return `https://explorer.sepolia.mantle.xyz/block/${blockNumber.toString()}`;
    }
    return `https://sepolia.etherscan.io/block/${blockNumber.toString()}`;
  };

  const getTransactionUrl = (txHash: string) => {
    if (chain?.id === 5003) {
      return `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;
    }
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  const formatTransactionHash = (hash: string | undefined) => {
    if (!hash) return '-';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // 获取事件的交易哈希
  const getEventHash = (event: any) => {
    // 尝试从不同的位置获取交易哈希
    return event.log?.transactionHash || 
           event.transaction?.hash || 
           event.transactionHash || 
           event.receipt?.transactionHash;
  };

  const getNetworkName = () => {
    if (chain?.id === 5003) return "Mantle Sepolia";
    if (chain?.id === 11155111) return "Sepolia";
    return "Unknown Network";
  };

  // 修改日志函数，添加更详细的信息
  const logEventDetails = (event: any) => {
    console.log('Event details:', {
      from: event.args.from,
      to: event.args.to,
      tokenId: event.args.tokenId?.toString(),
      blockNumber: event.block?.number?.toString(),
      timestamp: event.block?.timestamp,
      // 添加完整的事件对象日志
      fullEvent: event
    });
  };

  useEffect(() => {
    if (mantleTransferEvents && mantleTransferEvents.length > 0) {
      console.log('All mantle transfer events:', mantleTransferEvents);
      mantleTransferEvents.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId?.toString()
        });
      });
    }
  }, [mantleTransferEvents]);

  useEffect(() => {
    if (mantlePurchaseEvents && mantlePurchaseEvents.length > 0) {
      console.log('All mantle purchase events:', mantlePurchaseEvents);
      mantlePurchaseEvents.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId?.toString()
        });
      });
    }
  }, [mantlePurchaseEvents]);

  useEffect(() => {
    if (sepoliaTransferEvents && sepoliaTransferEvents.length > 0) {
      console.log('All sepolia transfer events:', sepoliaTransferEvents);
      sepoliaTransferEvents.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId?.toString()
        });
      });
    }
  }, [sepoliaTransferEvents]);

  useEffect(() => {
    if (sepoliaPurchaseEvents && sepoliaPurchaseEvents.length > 0) {
      console.log('All sepolia purchase events:', sepoliaPurchaseEvents);
      sepoliaPurchaseEvents.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId?.toString()
        });
      });
    }
  }, [sepoliaPurchaseEvents]);

  const formatAddressWithLabel = (address: string, type: 'from' | 'to') => {
    return (
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 mb-1">
          {type === 'from' ? '发送方' : '接收方'}:
        </span>
        <Address address={address} />
      </div>
    );
  };

  // 添加函数来获取 TokenID 的状态
  const getTokenStatus = (event: any) => {
    // 如果是铸造
    if (event.args.from === '0x0000000000000000000000000000000000000000') {
      return {
        status: 'mint',
        displayClass: 'bg-green-500',
      };
    }
    // 如果是销毁（转移到零地址）
    if (event.args.to === '0x0000000000000000000000000000000000000000') {
      return {
        status: 'burn',
        displayClass: 'bg-red-500',
      };
    }
    // 普通转移
    return {
      status: 'transfer',
      displayClass: 'bg-purple-500',
    };
  };

  // 添加分页相关的状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 每页显示12条数据

  // 计算分页数据
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allEvents?.slice(startIndex, endIndex) || [];
  }, [allEvents, currentPage]);

  // 计算总页数
  const totalPages = Math.ceil((allEvents?.length || 0) / itemsPerPage);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="animate-pulse">
          <div className="w-16 h-16 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1147] py-8 relative overflow-hidden">
      {/* 背景动画效果 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>

      {/* 霓虹灯线条 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-pulse"></div>

      <div className="container mx-auto px-4 relative">
        {/* 标题部分 */}
        <div className="text-center mb-12 relative">
          <div className={`absolute inset-0 bg-purple-500/20 blur-3xl transition-opacity duration-1000 ${glowEffect ? 'opacity-30' : 'opacity-0'}`}></div>
          <h1 className="text-5xl font-bold mb-2 cyberpunk-text relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-text-shine">
              交易历史记录
            </span>
          </h1>
          <p className="text-gray-400 text-lg">TRANSACTION HISTORY - {getNetworkName()}</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "总交易数", value: allEvents?.length || 0, icon: "" },
            { 
              title: "最新区块", 
              value: allEvents && allEvents.length > 0
                ? Number(allEvents[0].block?.number || 0).toLocaleString()
                : 0,
              icon: "🔗"
            },
            { 
              title: "活跃地址", 
              value: new Set(allEvents?.map(e => e.args.from)).size || 0,
              icon: "👥"
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-[#231564]/50 rounded-xl p-6 backdrop-blur-sm border border-[#3d2b85] relative group hover:border-purple-500 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-gray-400 mb-2 text-sm uppercase tracking-wider">{stat.title}</div>
                <div className="text-3xl font-bold text-white cyberpunk-number">{stat.value}</div>
              </div>
              <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>

        {/* 交易列表 */}
        <div className="bg-[#231564]/50 rounded-xl overflow-hidden backdrop-blur-sm border border-[#3d2b85] relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="overflow-x-auto relative">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3d2b85]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Token ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">发送方</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">接收方</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">区块</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">交易哈希</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d2b85]">
                {!paginatedEvents || paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      暂无交易记录
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event, index) => {
                    // 添加日志
                    logEventDetails(event);
                    
                    const timestamp = event.block?.timestamp 
                      ? new Date(Number(event.block.timestamp) * 1000).toLocaleString()
                      : '-';
                    
                    // 使用新的获取哈希方法
                    const txHash = getEventHash(event);
                    
                    return (
                      <tr key={index} className="hover:bg-[#3d2b85]/20 transition-colors">
                        <td className="px-6 py-4">
                          {getEventTypeDisplay(event)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {/* 修改 TokenID 显示 */}
                            {(() => {
                              const { status, displayClass } = getTokenStatus(event);
                              return (
                                <>
                                  <div className={`w-8 h-8 rounded-lg ${displayClass} flex items-center justify-center text-white font-bold`}>
                                    #{event.args.tokenId?.toString()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-gray-300">
                                      #{event.args.tokenId?.toString()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {status === 'mint' && '新铸造'}
                                      {status === 'burn' && '已销毁'}
                                      {status === 'transfer' && '转移'}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {formatAddressWithLabel(event.args.from, 'from')}
                        </td>
                        <td className="px-6 py-4">
                          {formatAddressWithLabel(event.args.to, 'to')}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={getExplorerUrl(event.block?.number || BigInt(0))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {event.block?.number?.toString() || '0'}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          {txHash ? (
                            <a
                              href={getTransactionUrl(txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              {formatTransactionHash(txHash)}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {timestamp}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 添加分页控制 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {/* 上一页按钮 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === 1
                    ? 'bg-[#1a1147] text-gray-500 cursor-not-allowed'
                    : 'bg-[#231564] text-white hover:bg-purple-500'
                  }`}
              >
                上一页
              </button>

              {/* 页码按钮 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentPage === page
                      ? 'bg-purple-500 text-white'
                      : 'bg-[#231564] text-white hover:bg-purple-500'
                    }`}
                >
                  {page}
                </button>
              ))}

              {/* 下一页按钮 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === totalPages
                    ? 'bg-[#1a1147] text-gray-500 cursor-not-allowed'
                    : 'bg-[#231564] text-white hover:bg-purple-500'
                  }`}
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 分页信息 */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          第 {currentPage} 页，共 {totalPages} 页
          （显示 {paginatedEvents.length} 条，共 {allEvents?.length || 0} 条记录）
        </div>

        {/* 页脚说明 */}
        <div className="mt-8 text-center text-gray-400 text-sm relative">
          <span className="inline-block hover:text-purple-400 transition-colors cursor-help">
            点击区块可以在对应网络的区块浏览器上查看详细信息
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-purple-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Click block number to view on block explorer
            </div>
          </span>
        </div>
      </div>

      {/* 全局样式 */}
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
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }

        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TransactionHistory;