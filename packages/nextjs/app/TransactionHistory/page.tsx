"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const TransactionHistory: NextPage = () => {
  const [glowEffect, setGlowEffect] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowEffect(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const { data: transferEvents, isLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Transfer",
    fromBlock: 0n,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="animate-pulse">
          <div className="w-16 h-16 border-4 border-purple-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );

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
          <p className="text-gray-400 text-lg">TRANSACTION HISTORY</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "总交易数", value: transferEvents?.length || 0, icon: "" },
            { 
              title: "最新区块", 
              value: transferEvents && transferEvents.length > 0
                ? Number(transferEvents[0].block?.number || 0).toLocaleString()
                : 0,
              icon: "🔗"
            },
            { 
              title: "活跃地址", 
              value: new Set(transferEvents?.map(e => e.args.from)).size || 0,
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">Token ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">发送方</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">接收方</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">区块</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-400">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d2b85]">
                {!transferEvents || transferEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      暂无交易记录
                    </td>
                  </tr>
                ) : (
                  transferEvents?.map((event, index) => {
                    const timestamp = event.block?.timestamp 
                      ? new Date(Number(event.block.timestamp) * 1000).toLocaleString()
                      : '-';
                    
                    return (
                      <tr key={index} className="hover:bg-[#3d2b85]/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              #{event.args.tokenId?.toString()}
                            </div>
                            <span className="text-gray-300">
                              #{event.args.tokenId?.toString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Address address={event.args.from} />
                        </td>
                        <td className="px-6 py-4">
                          <Address address={event.args.to} />
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`https://sepolia.etherscan.io/block/${event.block?.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {event.block?.number?.toString()}
                          </a>
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

        {/* 页脚说明 */}
        <div className="mt-8 text-center text-gray-400 text-sm relative">
          <span className="inline-block hover:text-purple-400 transition-colors cursor-help">
            点击区块号可以在 Etherscan 上查看详细信息
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-purple-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Click block number to view on Etherscan
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
