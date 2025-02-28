import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { notification } from "antd";
import { useRouter } from "next/navigation";

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

interface MyHoldingsProps {
  filteredNFTs: NftInfo[];
  onNFTUpdate: () => void;
}

export const MyHoldings: React.FC<MyHoldingsProps> = ({ filteredNFTs, onNFTUpdate }) => {
  const { address: connectedAddress } = useAccount();
  const [nfts, setNfts] = useState<NftInfo[]>(filteredNFTs);
  const [listingPrice, setListingPrice] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const router = useRouter();

  // 初始化时从 filteredNFTs 中获取 NFTs
  useEffect(() => {
    setNfts(filteredNFTs);
  }, [filteredNFTs]);

  // 处理上架/下架
  const handleListToggle = async (nft: NftInfo) => {
    try {
      const newListedStatus = !nft.isListed;
      
      // 如果是上架操作，检查价格
      if (newListedStatus) {
        if (!listingPrice[nft.id]) {
          notification.error({ message: "请设置价格" });
          return;
        }
      }

      // 使用当前输入框中的价格或保持原价格
      const currentPrice = newListedStatus ? listingPrice[nft.id] : nft.price;

      // 发送更新请求到数据库
      const response = await fetch('/api/Nft/list', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: nft.id,
          isListed: newListedStatus,
          price: currentPrice,
          owner: nft.owner
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '操作失败');
      }

      // 更新本地状态
      setNfts(prevNfts => 
        prevNfts.map(item => 
          item.id === nft.id 
            ? { 
                ...item, 
                isListed: newListedStatus,
                price: currentPrice
              }
            : item
        )
      );

      // 清空输入框的值
      setListingPrice(prev => ({
        ...prev,
        [nft.id]: ''
      }));
      
      // 操作成功后调用更新函数
      onNFTUpdate();
      
      notification.success({
        message: newListedStatus ? '上架成功' : '下架成功',
        description: newListedStatus 
          ? `NFT #${nft.id} 已上架，价格: ${currentPrice} ETH`
          : `NFT #${nft.id} 已下架`
      });

    } catch (error) {
      console.error('操作失败:', error);
      notification.error({
        message: '操作失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 计算当前页的NFTs
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNFTs = nfts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(nfts.length / itemsPerPage);

  // 添加格式化价格的辅助函数
  const formatPrice = (price: string) => {
    // 如果价格为空或无效，返回 "0 ETH"
    if (!price || isNaN(Number(price))) {
      return "0 ETH";
    }

    // 将字符串转换为数字
    const priceNum = Number(price);
    
    // 如果价格非常小（小于0.0001），使用科学计数法
    if (priceNum > 0 && priceNum < 0.0001) {
      return `${priceNum.toExponential(4)} ETH`;
    }
    
    // 对于正常范围的价格，保留4位小数
    return `${priceNum.toFixed(4)} ETH`;
  };

  const handleNFTClick = (nftId: number) => {
    router.push(`/nftVR?id=${nftId}`);
  };

  return (
    <div>
      {/* NFT网格布局 */}
      <div className="grid grid-cols-2 gap-4">
        {currentNFTs.map((nft, index) => (
          <div 
            key={index}
            className="bg-[#231564] rounded-lg overflow-hidden border border-[#3d2b85] float-card"
          >
            {/* NFT图片 */}
            <div 
              className="aspect-square relative cursor-pointer hologram-effect"
              onClick={() => handleNFTClick(nft.id)}
            >
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* NFT信息 */}
            <div className="p-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-base font-bold text-white neon-text">{nft.name}</h3>
                <button
                  onClick={() => handleNFTClick(nft.id)}
                  disabled={true}
                  className="px-2 py-1 text-xs bg-gray-500 cursor-not-allowed text-white rounded-md transition-colors"
                >
                  3D展厅
                </button>
              </div>
              
              <p className="text-gray-400 text-xs mb-2 line-clamp-2">{nft.description}</p>
              <div className="flex justify-between items-center mb-3">
                <div className="text-lg font-medium text-purple-400 matrix-rain">{formatPrice(nft.price)}</div>
                <div className="px-2 py-0.5 rounded-full bg-[#1a1147] text-purple-400 text-xs scan-effect">{nft.attributes[0]?.value}</div>
              </div>

              {/* 上架控制 */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#3d2b85]">
                <button
                  onClick={() => handleListToggle(nft)}
                  className={`flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors energy-pulse ${
                    nft.isListed
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  {nft.isListed ? '下架' : '上架'}
                </button>
                {!nft.isListed && (
                  <input
                    type="text"
                    value={listingPrice[nft.id] || ""}
                    onChange={(e) => setListingPrice(prev => ({ 
                      ...prev, 
                      [nft.id]: e.target.value 
                    }))}
                    placeholder="Price in ETH"
                    className="flex-1 bg-[#1a1147] border border-[#3d2b85] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                )}
                {nft.isListed && (
                  <div className="text-sm text-gray-400 matrix-rain">
                    价格: {formatPrice(nft.price)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-2 py-0.5 rounded-md text-xs energy-pulse ${
              currentPage === 1
                ? 'bg-[#1a1147] text-gray-500 cursor-not-allowed'
                : 'bg-[#231564] text-white hover:bg-purple-500 transition-colors'
            }`}
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-2 py-0.5 rounded-md text-xs energy-pulse ${
                currentPage === index + 1
                  ? 'bg-purple-500 text-white'
                  : 'bg-[#231564] text-white hover:bg-purple-500 transition-colors'
              }`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-2 py-0.5 rounded-md text-xs energy-pulse ${
              currentPage === totalPages
                ? 'bg-[#1a1147] text-gray-500 cursor-not-allowed'
                : 'bg-[#231564] text-white hover:bg-purple-500 transition-colors'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {nfts.length === 0 && (
        <div className="text-center py-8 text-gray-400 neon-text">
          No NFTs found in this category
        </div>
      )}
    </div>
  );
};
