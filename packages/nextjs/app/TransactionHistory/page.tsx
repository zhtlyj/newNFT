"use client";

import { useState, useEffect, useMemo } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useNetwork, useAccount } from "wagmi";

interface TransferEvent {
  type: 'Transfer';
  displayName: string;
  args: {
    from: string;
    to: string;
    tokenId: bigint;
  };
  block: {
    number: bigint;
    timestamp: bigint;
  };
}

interface PurchaseEvent {
  type: 'Purchase';
  displayName: string;
  args: {
    buyer: string;
    seller: string;
    tokenId: bigint;
    price: bigint;
  };
  block: {
    number: bigint;
    timestamp: bigint;
  };
}

type Event = TransferEvent | PurchaseEvent;

const TransactionHistory: NextPage = () => {
  const [glowEffect, setGlowEffect] = useState(false);
  const { chain } = useNetwork();
  const { address: currentUserAddress } = useAccount();
  const [showOnlyMyTransactions, setShowOnlyMyTransactions] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterAddress, setFilterAddress] = useState("");
  const [showAllTransactions, setShowAllTransactions] = useState(true);

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
        args: {
          from: event.args[0],
          to: event.args[1],
          tokenId: event.args[2],
        }
      })),
      ...(currentPurchaseEvents || []).map(event => ({
        ...event,
        type: 'Purchase',
        displayName: '购买',
        args: {
          tokenId: event.args[0],
          buyer: event.args[1],
          seller: event.args[2],
          price: event.args[3],
        }
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

  // 修改过滤交易的函数
  const filteredTransactions = useMemo(() => {
    if (!showOnlyMyTransactions || !currentUserAddress) {
      return allEvents;
    }
    
    return allEvents.filter((event) => {
      const userAddress = currentUserAddress.toLowerCase();
      
      if (event.type === 'Transfer') {
        const from = event.args.from.toLowerCase();
        const to = event.args.to.toLowerCase();
        return from === userAddress || to === userAddress;
      } 
      
      if (event.type === 'Purchase') {
        const buyer = event.args.buyer.toLowerCase();
        const seller = event.args.seller.toLowerCase();
        return buyer === userAddress || seller === userAddress;
      }
      
      return false;
    });
  }, [allEvents, currentUserAddress, showOnlyMyTransactions]);

  // 修改分页逻辑，使用 filteredTransactions 而不是 allEvents
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions?.slice(startIndex, endIndex) || [];
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // 修改总页数计算
  const totalPages = Math.ceil((filteredTransactions?.length || 0) / itemsPerPage);

  // 修改分页处理函数
  const handlePageChange = (page: number) => {
    // 添加过渡类
    const tbody = document.querySelector('tbody');
    if (tbody) {
      tbody.classList.add('changing-page');
      setTimeout(() => {
        setCurrentPage(page);
        setTimeout(() => {
          tbody.classList.remove('changing-page');
        }, 50);
      }, 300);
    } else {
      setCurrentPage(page);
    }
  };

  // 修改过滤切换处理
  const handleFilterChange = (showOnlyMine: boolean) => {
    const tbody = document.querySelector('tbody');
    if (tbody) {
      tbody.classList.add('changing-filter');
      setTimeout(() => {
        setShowOnlyMyTransactions(showOnlyMine);
        setCurrentPage(1);
        setTimeout(() => {
          tbody.classList.remove('changing-filter');
        }, 50);
      }, 300);
    } else {
      setShowOnlyMyTransactions(showOnlyMine);
      setCurrentPage(1);
    }
  };

  // 修改表格渲染部分
  const renderAddress = (event: any) => {
    if (event.type === 'Transfer') {
      return (
        <>
          <td className="px-6 py-4">
            {formatAddressWithLabel(event.args.from, 'from')}
          </td>
          <td className="px-6 py-4">
            {formatAddressWithLabel(event.args.to, 'to')}
          </td>
        </>
      );
    } else if (event.type === 'Purchase') {
      return (
        <>
          <td className="px-6 py-4">
            {formatAddressWithLabel(event.args.seller, 'from')}
          </td>
          <td className="px-6 py-4">
            {formatAddressWithLabel(event.args.buyer, 'to')}
          </td>
        </>
      );
    }
  };

  // 修改统计信息的计算
  const getActiveAddresses = (events: any[]) => {
    const addresses = new Set<string>();
    events.forEach(event => {
      if (event.type === 'Transfer') {
        addresses.add(event.args.from.toLowerCase());
        addresses.add(event.args.to.toLowerCase());
      } else if (event.type === 'Purchase') {
        addresses.add(event.args.buyer.toLowerCase());
        addresses.add(event.args.seller.toLowerCase());
      }
    });
    // 移除零地址
    addresses.delete('0x0000000000000000000000000000000000000000');
    return addresses.size;
  };

  // 修改渲染交易项的函数
  const renderTransactionItem = (event: Event, index: number) => (
    <tr
      key={`${event.type}-${event.args.tokenId}-${event.block?.number?.toString()}`}
      className="tr-animate"
      style={{
        '--delay': `${index * 50}ms`,
      } as React.CSSProperties}
    >
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm
          ${event.type === 'Transfer' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}
        >
          {getEventTypeDisplay(event)}
        </span>
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
      {renderAddress(event)}
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
        {getEventHash(event) ? (
          <a
            href={getTransactionUrl(getEventHash(event))}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            {formatTransactionHash(getEventHash(event))}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-400 text-sm">
        {event.block?.timestamp ? new Date(Number(event.block.timestamp) * 1000).toLocaleString() : '-'}
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1147] py-8 relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          {/* 标题部分和切换按钮的容器 */}
          <div className="flex justify-between items-start mb-12">
            {/* 标题部分 */}
            <div className="text-center relative flex-grow">
              <h1 className="text-5xl font-bold mb-2 cyberpunk-text relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  交易历史记录
                </span>
              </h1>
              <p className="text-gray-400 text-lg">TRANSACTION HISTORY - {getNetworkName()}</p>
            </div>
          </div>

          {/* 表格容器 */}
          <div className="table-container bg-[#231564]/50 rounded-xl overflow-hidden backdrop-blur-sm border border-[#3d2b85]">
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
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="loading-container">
                      <div 
                        className="glitch-text loading-text"
                        data-text="正在加载交易记录"
                      >
                        正在加载交易记录
                      </div>
                      <div className="cyberpunk-loader"></div>
                      <div className="scanning-text">
                        SCANNING BLOCKCHAIN DATA...
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
        {/* 标题部分和切换按钮的容器 */}
        <div className="flex justify-between items-start mb-12">
          {/* 标题部分 */}
          <div className="text-center relative flex-grow">
            <div className={`absolute inset-0 bg-purple-500/20 blur-3xl transition-opacity duration-1000 ${glowEffect ? 'opacity-30' : 'opacity-0'}`}></div>
            <h1 className="text-5xl font-bold mb-2 cyberpunk-text relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-text-shine">
                交易历史记录
              </span>
            </h1>
            <p className="text-gray-400 text-lg">TRANSACTION HISTORY - {getNetworkName()}</p>
          </div>

          {/* 切换按钮移到右上角 */}
          <div className="flex flex-col items-end gap-2">
            <div className="bg-[#231564] p-1 rounded-xl shadow-lg border border-purple-500/30">
              <div className="flex items-center">
                <button
                  onClick={() => handleFilterChange(false)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    !showOnlyMyTransactions
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                  }`}
                >
                  全部交易记录
                </button>
                <button
                  onClick={() => handleFilterChange(true)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    showOnlyMyTransactions
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                  }`}
                >
                  {currentUserAddress ? '我的交易记录' : '请先连接钱包'}
                </button>
              </div>
            </div>
            {/* 当前视图提示 */}
            {showOnlyMyTransactions && currentUserAddress && (
              <p className="text-sm text-purple-400">
                当前显示地址: {currentUserAddress.slice(0, 6)}...{currentUserAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { 
              title: showOnlyMyTransactions ? "我的交易数" : "总交易数", 
              value: filteredTransactions.length, 
              icon: "📊" 
            },
            { 
              title: "最新区块", 
              value: filteredTransactions.length > 0
                ? Number(filteredTransactions[0].block?.number || 0).toLocaleString()
                : 0,
              icon: "🔗"
            },
            { 
              title: "活跃地址", 
              value: getActiveAddresses(filteredTransactions),
              icon: "👥"
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className="stat-card bg-[#231564]/50 rounded-xl p-6 backdrop-blur-sm border border-[#3d2b85] relative group hover:border-purple-500 transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-gray-400 mb-2 text-sm uppercase tracking-wider">{stat.title}</div>
                <div className="text-3xl font-bold text-white cyberpunk-number number-animate">
                  {stat.value}
                </div>
              </div>
              <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          ))}
        </div>

        {/* 交易列表 */}
        <div className="bg-[#231564]/50 rounded-xl overflow-hidden backdrop-blur-sm border border-[#3d2b85] relative table-container">
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
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="loading-container">
                        <div 
                          className="glitch-text loading-text"
                          data-text="正在加载交易记录"
                        >
                          正在加载交易记录
                        </div>
                        <div className="cyberpunk-loader"></div>
                        <div className="scanning-text">
                          SCANNING BLOCKCHAIN DATA...
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event, index) => renderTransactionItem(event, index))
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

        {/* 更新分页信息显示 */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          第 {currentPage} 页，共 {totalPages} 页
          （显示 {filteredTransactions.length} 条，共 {allEvents?.length || 0} 条记录）
          {showOnlyMyTransactions && currentUserAddress && (
            <span className="ml-2 text-purple-400">
              - 仅显示与您地址相关的交易
            </span>
          )}
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

        /* 表格行动画 */
        .tr-animate {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInUp 0.5s ease forwards;
          animation-delay: var(--delay, 0ms);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 分页切换动画 */
        .changing-page tbody {
          opacity: 0;
          transform: translateX(-20px);
          transition: all 0.3s ease;
        }

        /* 表格容器动画 */
        .table-container {
          position: relative;
          overflow: hidden;
        }

        .table-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(128, 90, 213, 0.1),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        /* 统计卡片动画 */
        .stat-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-card::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(128, 90, 213, 0.1) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .stat-card:hover::after {
          transform: translateX(100%);
        }

        /* 数字滚动动画 */
        .number-animate {
          animation: numberScale 0.3s ease-out;
        }

        @keyframes numberScale {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionHistory;