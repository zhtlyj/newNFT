"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { uploadToPinata } from "~~/components/simpleNFT/pinata";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { VALID_CATEGORIES } from "../page";
import axios from "axios";

interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  CID?: string;
}

const CreateNFT: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  
  // NFT创建相关状态
  const [nftInfo, setNftInfo] = useState<NftInfo>({
    image: "",
    id: Date.now(),
    name: "",
    attributes: [],
    owner: connectedAddress || "",
    price: "",
    description: "",
  });
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // IPFS上传相关状态
  const [loading, setLoading] = useState(false);
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageData, setImageData] = useState<{ id: number, name: string, onChainAddress: string }[]>([]);

  const { writeAsync: mintItem } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintItem",
    args: [connectedAddress, ""],
  });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 加载已保存的NFT和图片数据
  useEffect(() => {
    const fetchNFTs = async () => {
      if (connectedAddress) {
        try {
          const response = await axios.get(`http://localhost:4000/getownerNfts/${connectedAddress}`);
          const nfts = response.data.nfts.map((nft: any) => ({
            image: nft.nft_image,
            id: nft.nft_id,
            name: nft.nft_name,
            attributes: nft.attributes,
            owner: nft.owner,
            price: nft.price,
            description: nft.description,
            CID: nft.CID
          }));
          setCreatedNFTs(nfts);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
        }
      }
    };

    fetchNFTs();
  }, [connectedAddress]);

  // NFT信息变更处理
  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftInfo({
      ...nftInfo,
      [name]: name === "attributes" ? value.split(",").map((attr) => ({ trait_type: name, value: attr })) : value,
    });
  };

  // IPFS上传处理
  const handleIpfsUpload = async () => {
    if (!image) {
      notification.error("请选择要上传的图片");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const imageUploadedItem = await uploadToPinata(image);

      notification.remove(notificationId);
      notification.success("已上传到IPFS");

      setUploadedIpfsPath(imageUploadedItem.IpfsHash);

      // 存储上传的图片详情
      const newImageData = {
        id: imageData.length + 1,
        name: image.name,
        onChainAddress: imageUploadedItem.IpfsHash,
      };
      setImageData([...imageData, newImageData]);
      localStorage.setItem(`image_${newImageData.id}`, JSON.stringify(newImageData));

      // 自动填充NFT图片链接
      setNftInfo(prev => ({
        ...prev,
        image: `https://ipfs.io/ipfs/${imageUploadedItem.IpfsHash}`
      }));
    } catch (error) {
      notification.remove(notificationId);
      notification.error("上传IPFS出错");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 添加预览图片状态
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // 修改图片选择处理函数，添加预览功能
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImage(file);
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // 在组件卸载时清理预览URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // NFT铸造处理
  const handleMintItem = async () => {
    const { image, id, name, attributes, owner, price, description } = nftInfo;
    if (image === "") {
      notification.error("请提供图片链接");
      return;
    }

    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const uploadedItem = await addToIPFS({ image, id, name, attributes, owner, price, description });
      notification.remove(notificationId);
      notification.success("数据已上传到IPFS中");

      if (tokenIdCounter !== undefined) {
        await mintItem({
          args: [connectedAddress, uploadedItem.path],
        });

        const newId = Number(tokenIdCounter) + 1;
        
        // 准备发送到服务器的数据
        const nftData = {
          nft_id: newId,
          nft_name: name,
          nft_image: image,
          CID: uploadedItem.CID,
          attributes,
          owner: connectedAddress,
          price,
          description
        };

        console.log("准备发送到服务器的数据:", nftData);

        try {
          // 发送到服务器
          const response = await axios.post('http://localhost:4000/mintNFT', nftData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log("服务器响应:", response.data);
          
          // 更新本地状态
          const newNftInfo: NftInfo = {
            ...nftInfo,
            id: newId,
            owner: connectedAddress || "",
            CID: uploadedItem.CID,
          };
          setCreatedNFTs(prev => [...prev, newNftInfo]);

        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("API 错误:", {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data
            });
            notification.error(`保存失败: ${error.message}`);
          } else {
            console.error("未知错误:", error);
            notification.error("发生未知错误");
          }
          return;
        }

        // 重置表单
        setNftInfo({
          image: "",
          id: Date.now(),
          name: "",
          attributes: [],
          owner: connectedAddress || "",
          price: "",
          description: "",
        });
      }
    } catch (error) {
      notification.remove(notificationId);
      console.error("Error:", error);
    }
  };

  // 添加模态框状态
  const [isImageListOpen, setIsImageListOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1147]">
      <div className="container mx-auto px-4 py-8">
        {/* 标题部分 */}
        <h1 className="text-4xl font-bold mb-2 text-white font-[Space Grotesk]">Upload File</h1>
        <p className="text-gray-400 mb-8">
          Upload image, Video, Audio, or 3D Model. File type supported: JPG, PNG, GIF, SVG,SVG,MP4, WEBM,MP3,WAV, OGG, GLB.
        </p>

        {/* 主要内容区域 - 左右布局 */}
        <div className="flex gap-8">
          {/* 左侧表单区域 */}
          <div className="flex-1">
            {/* 上传区域 - 调整大小并添加按钮 */}
            <div className="bg-[#231564] rounded-2xl mb-8">
              {/* 上传框 */}
              <div className="border border-dashed border-[#3d2b85] rounded-2xl m-1.5 h-[200px] flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors">
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.glb"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center">
                    {/* 上传图标 */}
                    <div className="w-10 h-10 mb-3 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-gray-300 text-sm mb-1">Drag & Drop File Or</p>
                    <p className="text-purple-400 text-sm">Upload From Your Device</p>
                  </div>
                </label>
              </div>

              {/* 底部区域：文件大小限制和上传按钮 */}
              <div className="flex justify-between items-center p-4">
                <p className="text-gray-400 text-sm">Max size:200 MB</p>
                <button
                  className={`px-6 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-700 transition-colors ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={loading}
                  onClick={handleIpfsUpload}
                >
                  {loading ? "Uploading..." : "Upload to IPFS"}
                </button>
              </div>
            </div>

            {/* NFT创建表单 */}
            <div className="bg-[#231564] rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Item Details</h2>
              <p className="text-gray-400 mb-6">Please fill the information below</p>
              
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Title"
                    className="w-full bg-[#1a1147] border border-[#3d2b85] rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
                    value={nftInfo.name}
                    onChange={handleNftInfoChange}
                  />
                </div>

                {/* Description */}
                <div>
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    className="w-full bg-[#1a1147] border border-[#3d2b85] rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
                    value={nftInfo.description}
                    onChange={handleNftInfoChange}
                  />
                </div>

                {/* Price */}
                <div>
                  <input
                    type="text"
                    name="price"
                    placeholder="Price"
                    className="w-full bg-[#1a1147] border border-[#3d2b85] rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
                    value={nftInfo.price}
                    onChange={handleNftInfoChange}
                  />
                </div>

                {/* Attributes - 改为下拉选择框 */}
                <div>
                  <select
                    name="attributes"
                    className="w-full bg-[#1a1147] border border-[#3d2b85] rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
                    value={nftInfo.attributes[0]?.value || ""}
                    onChange={(e) => {
                      setNftInfo(prev => ({
                        ...prev,
                        attributes: [{ trait_type: 'category', value: e.target.value }]
                      }));
                    }}
                  >
                    <option value="" disabled>Select Category</option>
                    {VALID_CATEGORIES.map((category) => (
                      <option key={category} value={category} className="bg-[#1a1147]">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 隐藏的图片链接字段 - 由上传功能自动填充 */}
                <input
                  type="hidden"
                  name="image"
                  value={nftInfo.image}
                />
              </div>

              {/* Create Item 按钮 */}
              <div className="mt-8">
                {!isConnected || isConnecting ? (
                  <RainbowKitCustomConnectButton />
                ) : (
                  <button
                    onClick={handleMintItem}
                    className="w-full bg-purple-600 text-white py-4 px-6 rounded-2xl hover:bg-purple-700 transition-colors font-semibold"
                  >
                    Create Item
                  </button>
                )}
              </div>
            </div>

            {/* 查看已上传图片按钮 */}
            <div className="mt-8">
              <button
                onClick={() => setIsImageListOpen(true)}
                className="w-full bg-[#231564] text-white py-4 px-6 rounded-2xl hover:bg-[#2a1a70] transition-colors flex items-center justify-center gap-2"
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
              </button>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="w-[400px]">
            <div className="sticky top-8">
              <h2 className="text-3xl font-bold text-[#9d8ec4] mb-6 font-[Space Grotesk]">Preview Item</h2>
              <div className="bg-[#231564] rounded-3xl overflow-hidden shadow-xl">
                {/* 图片预览区 */}
                <div className="aspect-square relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-[#1a1147]">
                      No media to preview
                    </div>
                  )}
                  
                  {/* 创建者头像 - 左下角 */}
                  {nftInfo.name && (
                    <div className="absolute left-4 -bottom-6 w-12 h-12 rounded-full border-4 border-[#231564] overflow-hidden">
                      <img
                        src="/profile.jpg" // 替换为实际的头像路径
                        alt="creator"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* NFT信息区域 */}
                {nftInfo.name && (
                  <div className="p-6 pt-8 bg-gradient-to-b from-[#231564] to-[#1a1147]">
                    {/* 标题和创建者 */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white mb-2">{nftInfo.name}</h3>
                      <p className="text-gray-400 text-sm">
                        by <span className="text-purple-400">Meta-Legends</span>
                      </p>
                    </div>

                    {/* 价格信息 */}
                    {nftInfo.price && (
                      <div className="mt-4">
                        <p className="text-gray-400 mb-1">Highest bid</p>
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-purple-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                          </svg>
                          <span className="text-xl font-bold text-purple-400">
                            {nftInfo.price} ETH
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 描述信息 */}
                    {nftInfo.description && (
                      <div className="mt-4 text-sm text-gray-400">
                        {nftInfo.description}
                      </div>
                    )}

                    {/* 其他属性 */}
                    {nftInfo.attributes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#3d2b85]">
                        <div className="flex flex-wrap gap-2">
                          {nftInfo.attributes.map((attr, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full bg-[#1a1147] text-purple-400 text-sm"
                            >
                              {attr.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNFT;
