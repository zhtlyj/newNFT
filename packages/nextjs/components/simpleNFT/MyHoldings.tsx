"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { notification, message } from "antd";
import axios from "axios";

// 添加接口定义
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

interface MyHoldingsProps {
  filteredNFTs: NftInfo[];
}

export const MyHoldings = ({ filteredNFTs }: MyHoldingsProps) => {
  const { address: connectedAddress } = useAccount();
  const [isListed, setIsListed] = useState<{ [key: number]: boolean }>({});
  const [listingPrice, setListingPrice] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // 重置所有状态
  const resetStates = () => {
    setIsListed({});
    setListingPrice({});
    setCurrentPage(1);
  };

  // 初始化状态
  useEffect(() => {
    resetStates();
    
    const initialListedState: { [key: number]: boolean } = {};
    const initialPriceState: { [key: number]: string } = {};
    
    filteredNFTs.forEach(nft => {
      initialListedState[nft.id] = nft.Shelves === 1;
      initialPriceState[nft.id] = nft.PurchasePrice;
    });
    
    setIsListed(initialListedState);
    setListingPrice(initialPriceState);

  }, [filteredNFTs, connectedAddress]); // 添加 connectedAddress 作为依赖

  // 计算当前页面显示的 NFTs
  const currentNFTs = filteredNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);

  const handleListToggle = async (checked: boolean, id: number) => {
    if (!connectedAddress) {
      message.error("请先连接钱包");
      return;
    }

    try {
      const price = checked ? listingPrice[id] : "0";
      
      if (checked && !listingPrice[id]) {
        message.error("请设置价格");
        return;
      }

      await axios.put('http://localhost:4000/updateShelf', {
        nft_id: id,
        shelvesValue: checked ? 1 : 0,
        price,
      });

      setIsListed(prev => ({ ...prev, [id]: checked }));
      if (!checked) {
        setListingPrice(prev => ({ ...prev, [id]: "" }));
      }

      message.success(checked ? "上架成功" : "下架成功");

    } catch (error) {
      console.error("Error updating NFT shelf status:", error);
      message.error("操作失败，请重试");
    }
  };

  const handlePriceChange = (id: number, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setListingPrice(prev => ({ ...prev, [id]: value }));
    }
  };

  if (!connectedAddress) {
    return (
      <div className="text-center py-8 text-gray-400">
        请先连接钱包
      </div>
    );
  }

  return (
    <div>
      {filteredNFTs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          暂无NFT
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {currentNFTs.map(nft => (
              <div 
                key={`nft-${nft.id}-${connectedAddress}`}
                className="bg-[#231564] rounded-lg overflow-hidden border border-[#3d2b85]"
              >
                <div className="aspect-square relative">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3">
                  <h3 className="text-base font-bold text-white">{nft.name}</h3>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">{nft.description}</p>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-[#3d2b85]">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">上架</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isListed[nft.id] || false}
                          onChange={(e) => handleListToggle(e.target.checked, nft.id)}
                        />
                        <div className="w-8 h-4 bg-[#1a1147] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={listingPrice[nft.id] || ""}
                      onChange={(e) => handlePriceChange(nft.id, e.target.value)}
                      placeholder="Price in ETH"
                      disabled={isListed[nft.id]}
                      className="flex-1 bg-[#1a1147] border border-[#3d2b85] rounded-md px-2 py-0.5 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-1">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={`page-${index + 1}`}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === index + 1
                      ? 'bg-purple-500 text-white'
                      : 'bg-[#231564] text-white hover:bg-purple-500'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
