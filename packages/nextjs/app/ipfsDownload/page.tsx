"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { Button, Input, notification } from "antd";
import axios from "axios";

interface ImageData {
  id: number;
  name: string;
  onChainAddress: string;
}

interface Seller {
  id: number;
  name: string;
  avatar: string;
  following: string;
  verified: boolean;
  twitter?: string;
}

const TOP_SELLERS: Seller[] = [
  { id: 1, name: "Coinbase_NFT", avatar: "/avatars1.png", following: "2.1M", verified: true, twitter: "Coinbase_NFT" },
  { id: 2, name: "CGAAPromo", avatar: "/avatars2.png", following: "526K", verified: true, twitter: "CGAAPromo" },
  { id: 3, name: "NftPinuts", avatar: "/avatars3.png", following: "892K", verified: true, twitter: "NftPinuts" },
  { id: 4, name: "audazityNFT", avatar: "/avatars4.png", following: "455K", verified: true, twitter: "audazityNFT" },
  { id: 5, name: "NftDaki", avatar: "/avatars5.png", following: "331K", verified: true, twitter: "NftDaki" },
];

const IpfsDownload: NextPage = () => {
  const [cid, setCid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImageListOpen, setIsImageListOpen] = useState(false);
  const [imageData, setImageData] = useState<ImageData[]>([]);

  // 加载已上传的图片数据
  useEffect(() => {
    const data: ImageData[] = [];
    let id = 1;
    let storedData = localStorage.getItem(`image_${id}`);
    while (storedData) {
      data.push(JSON.parse(storedData));
      id++;
      storedData = localStorage.getItem(`image_${id}`);
    }
    setImageData(data);
  }, []);

  // Pinata API 配置
  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  const downloadFromPinata = async () => {
    if (!cid) {
      notification.error({ message: "请输入 IPFS CID" });
      return;
    }

    try {
      setIsLoading(true);

      // 从 IPFS 网关获取文件 - 使用 ipfs.io 网关作为备选
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}` 
      ];

      let response;
      for (const gateway of gateways) {
        try {
          response = await axios.get(gateway, {
            responseType: 'blob',
            headers: PINATA_API_KEY ? {
              'pinata_api_key': PINATA_API_KEY,
              'pinata_secret_api_key': PINATA_SECRET_KEY
            } : {}
          });
          break;
        } catch (err) {
          console.log(`Gateway ${gateway} failed, trying next...`);
          continue;
        }
      }

      if (!response) {
        throw new Error("所有网关都无法访问");
      }

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `ipfs-${cid}`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notification.success({ message: "下载成功！" });
    } catch (error) {
      console.error('下载失败:', error);
      notification.error({ message: "下载失败，请检查 CID 是否正确或网络连接" });
    } finally {
      setIsLoading(false);
    }
  };

  // 修复 TypeScript 错误
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCid(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#1a1147] py-8 relative overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>

      <div className="container mx-auto px-4 relative">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 cyberpunk-text">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              IPFS 文件下载
            </span>
          </h1>
          <p className="text-gray-400">输入 IPFS CID 下载您的文件</p>
        </div>

        {/* 下载表单 */}
        <div className="max-w-xl mx-auto">
          <div className="bg-[#231564]/50 rounded-xl p-8 backdrop-blur-sm border border-[#3d2b85] relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative space-y-6">
              {/* CID 输入框 */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm">IPFS CID</label>
                <Input
                  value={cid}
                  onChange={handleInputChange}
                  placeholder="输入 IPFS CID"
                  className="w-full bg-[#1a1147] border border-[#3d2b85] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* 下载按钮 */}
              <Button
                onClick={downloadFromPinata}
                loading={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {isLoading ? "下载中..." : "下载文件"}
              </Button>

              {/* 提示信息 */}
              <div className="text-sm text-gray-400">
                <p className="mb-2">提示：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>确保输入正确的 IPFS CID</li>
                  <li>下载可能需要一些时间，请耐心等待</li>
                  <li>如果下载失败，请检查网络连接</li>
                </ul>
              </div>
            </div>

            {/* 装饰性边框 */}
            <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>

        {/* 添加查看已上传图片按钮 */}
        <div className="max-w-xl mx-auto mt-8">
          <Button
            onClick={() => setIsImageListOpen(true)}
            className="w-full h-12 bg-[#231564] text-white font-bold rounded-xl hover:bg-[#2a1a70] transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            View Uploaded Images
          </Button>
        </div>
      </div>

      {/* 已上传图片列表模态框 */}
      {isImageListOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#231564] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Uploaded Images</h2>
              <button
                onClick={() => setIsImageListOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#3d2b85]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Preview</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">IPFS Link</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d2b85]">
                  {imageData.map((row) => (
                    <tr key={row.id} className="hover:bg-[#2a1a70] transition-colors">
                      <td className="py-3 px-4 text-white">{row.id}</td>
                      <td className="py-3 px-4 text-white">{row.name}</td>
                      <td className="py-3 px-4">
                        <img
                          src={`https://ipfs.io/ipfs/${row.onChainAddress}`}
                          alt={row.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://ipfs.io/ipfs/${row.onChainAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          View on IPFS
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          onClick={() => {
                            setCid(row.onChainAddress);
                            setIsImageListOpen(false);
                          }}
                          className="bg-purple-500 text-white hover:bg-purple-600 border-none"
                        >
                          Use CID
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 添加 Top Seller 展示区域 */}
      <div className="container mx-auto px-4 mt-20">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold cyberpunk-text">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Top Seller
            </span>
          </h2>
          <div className="absolute w-full top-0 left-0 text-[120px] font-bold text-white/5 select-none pointer-events-none">
            Seller
          </div>
        </div>

        {/* 卖家卡片展示区 */}
        <div className="flex gap-6 overflow-x-auto pb-8 px-4 -mx-4 scrollbar-hide">
          {TOP_SELLERS.map((seller) => (
            <div
              key={seller.id}
              className="group perspective"
            >
              <div className="relative w-64 h-[120px] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] transition-transform duration-500">
                {/* 卡片正面 */}
                <div className="absolute inset-0 bg-[#231564]/80 rounded-2xl p-4 backface-hidden">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {seller.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{seller.name}</h3>
                      <div className="flex items-center gap-1 text-gray-400">
                        <svg 
                          className="w-4 h-4" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M23 9a5 5 0 0 0-5-5h-2V2a1 1 0 0 0-1.5-.87l-13 7A1 1 0 0 0 1 9a1 1 0 0 0 .5.87l13 7A1 1 0 0 0 16 16v-2h2a5 5 0 0 0 5-5zm-15.5.5l9-4.87V6a3 3 0 0 1 3 3 3 3 0 0 1-3 3v1.37l-9-4.87z"/>
                        </svg>
                        <span>{seller.following} Followers</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 卡片背面 */}
                <div className="absolute inset-0 bg-[#231564]/80 rounded-2xl p-4 [transform:rotateY(180deg)] backface-hidden">
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <h4 className="text-white font-semibold mb-2">Contact Info</h4>
                    <p className="text-gray-400 text-sm">@{seller.twitter}</p>
                    <a
                      href={`https://twitter.com/${seller.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors flex items-center gap-2 group"
                    >
                      <svg 
                        className="w-4 h-4 transition-transform group-hover:scale-110" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Follow on Twitter
                      <svg 
                        className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        .cyberpunk-text {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5),
                      0 0 20px rgba(168, 85, 247, 0.3),
                      0 0 30px rgba(168, 85, 247, 0.2);
        }

        .bg-grid-pattern {
          background-image: linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .perspective {
          perspective: 1000px;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }

        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default IpfsDownload;
