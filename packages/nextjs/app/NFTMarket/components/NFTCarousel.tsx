import React, { useState, useEffect, useMemo } from "react";
import { Button } from "antd";
import axios from "axios";
import { notification } from "antd";
import { Address } from "~~/components/scaffold-eth";

// 添加点赞相关的接口
interface NFTLikes {
  [key: string]: {
    count: number;
    users: string[];
  };
}

interface NFTCarouselProps {
  nfts: any[];
  onOpenModal: (nft: any) => void;
  getPriceById: (id: number) => string;
  connectedAddress?: string;
}

const NFTCarousel: React.FC<NFTCarouselProps> = ({
  nfts,
  onOpenModal,
  getPriceById,
  connectedAddress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const itemsPerSlide = 3;

  // 只在需要无缝轮播时添加必要的重复项
  const extendedNFTs = useMemo(() => {
    if (nfts.length <= itemsPerSlide) {
      return nfts;
    }
    // 只添加一组额外的 NFTs 用于无缝轮播
    return [...nfts, ...nfts.slice(0, itemsPerSlide)];
  }, [nfts, itemsPerSlide]);

  // 添加点赞状态
  const [likes, setLikes] = useState<NFTLikes>({});

  // 获取收藏数据
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('http://localhost:4000/getFavorites');
        const favorites = response.data.nfts;
        
        // 转换数据格式
        const likesData: NFTLikes = {};
        favorites.forEach((fav: any) => {
          const nftId = fav.nft_id.toString();
          if (!likesData[nftId]) {
            likesData[nftId] = {
              count: 0,
              users: []
            };
          }
          likesData[nftId].count++;
          likesData[nftId].users.push(fav.owner);
        });
        
        setLikes(likesData);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []);

  // 处理点赞/取消点赞
  const handleLike = async (nftId: string) => {
    if (!connectedAddress) {
      notification.error({ message: "请先连接钱包" });
      return;
    }

    try {
      const hasUserLiked = likes[nftId]?.users.includes(connectedAddress);

      if (hasUserLiked) {
        // 取消收藏
        await axios.delete(`http://localhost:4000/removeFavorite/${nftId}`);
        
        setLikes(prevLikes => ({
          ...prevLikes,
          [nftId]: {
            count: (prevLikes[nftId]?.count || 1) - 1,
            users: (prevLikes[nftId]?.users || []).filter(user => user !== connectedAddress)
          }
        }));

        notification.success({ message: "已取消收藏" });
      } else {
        // 添加收藏
        await axios.post('http://localhost:4000/addFavorite', {
          nftId: nftId,
          owner: connectedAddress
        });

        setLikes(prevLikes => ({
          ...prevLikes,
          [nftId]: {
            count: (prevLikes[nftId]?.count || 0) + 1,
            users: [...(prevLikes[nftId]?.users || []), connectedAddress]
          }
        }));

        notification.success({ message: "收藏成功" });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      notification.error({ 
        message: "操作失败", 
        description: error instanceof Error ? error.message : "未知错误" 
      });
    }
  };

  // 检查是否已收藏
  const hasLiked = (nftId: string) => {
    return likes[nftId]?.users.includes(connectedAddress || '');
  };

  // 获取收藏数
  const getLikeCount = (nftId: string) => {
    return likes[nftId]?.count || 0;
  };

  // 自动轮播
  useEffect(() => {
    if (isPaused || nfts.length <= itemsPerSlide) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // 当到达第二组的末尾时，无缝切回第一组的对应位置
        if (next >= nfts.length * 2) {
          return nfts.length;
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, nfts.length]);

  // 处理过渡结束时的位置重置
  const handleTransitionEnd = () => {
    if (currentIndex >= nfts.length) {
      setCurrentIndex(0);
    }
  };

  // 添加调试日志
  useEffect(() => {
    console.log("NFTs data:", nfts);
  }, [nfts]);

  // 在渲染NFT卡片时修改点赞按钮部分
  const renderNFTCard = (nft: any, index: number) => (
    <div
      key={`${nft.id}-${index}`}
      className="min-w-[33.333%] px-3"
      style={{ maxWidth: "400px" }}
    >
      <div className="h-full bg-[#231564]/50 rounded-3xl overflow-hidden backdrop-blur-sm border border-[#3d2b85] group hover:border-purple-500 transition-all duration-300">
        {/* NFT图片 */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 cursor-pointer group/like"
               onClick={() => handleLike(nft.id.toString())}
          >
            <svg 
              className={`w-4 h-4 transition-colors ${
                hasLiked(nft.id.toString()) ? 'text-pink-500' : 'text-gray-400 group-hover/like:text-pink-400'
              }`} 
              fill={hasLiked(nft.id.toString()) ? 'currentColor' : 'none'} 
              viewBox="0 0 20 20" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={hasLiked(nft.id.toString()) ? 0 : 2}
                fillRule="evenodd" 
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className={`text-sm ${
              hasLiked(nft.id.toString()) ? 'text-pink-500' : 'text-white group-hover/like:text-pink-400'
            }`}>
              {getLikeCount(nft.id.toString())}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
              <img
                src={`https://avatars.dicebear.com/api/pixel-art/${nft.owner}.svg`}
                alt="author"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              by {nft.owner.slice(0, 6)}...
            </span>
          </div>
        </div>

        {/* NFT信息 */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-2 truncate">{nft.name}</h3>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 text-sm">当前出价</span>
              <span className="text-white font-bold text-sm">
                {nft.PurchasePrice ? `${nft.PurchasePrice} ETH` : '不适用'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400 text-xs">住</span>
            </div>
          </div>

          <Button
            onClick={() => onOpenModal(nft)}
            disabled={!connectedAddress}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white font-bold py-1.5 text-sm rounded-xl hover:opacity-90 transition-opacity"
          >
            {connectedAddress ? "出 价" : "连接钱包"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="relative" 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${(currentIndex * 100) / itemsPerSlide}%)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedNFTs.map((nft, index) => renderNFTCard(nft, index))}
        </div>
      </div>

      {/* 控制按钮 */}
      <button
        onClick={() => {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex < 0 ? nfts.length - 1 : newIndex);
          setIsPaused(true);
        }}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-r-xl p-2 backdrop-blur-sm transition-colors h-20 flex items-center"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex >= nfts.length ? 0 : newIndex);
          setIsPaused(true);
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-l-xl p-2 backdrop-blur-sm transition-colors h-20 flex items-center"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 指示器 */}
      <div className="flex justify-center mt-4 gap-1.5">
        {Array.from({ length: Math.ceil(nfts.length / itemsPerSlide) }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index * itemsPerSlide);
              setIsPaused(true);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              Math.floor(currentIndex / itemsPerSlide) === index
                ? 'bg-purple-500'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NFTCarousel; 