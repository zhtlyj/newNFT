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
import { PixelNft } from "../../components/simpleNFT/PixelNft";

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

const saveNFTToDatabase = async (nftData: NftInfo) => {
  try {
    console.log('正在发送NFT数据到服务器:', {
      ...nftData,
      isListed: false
    });
    
    const response = await fetch('/api/Nft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...nftData,
        isListed: false
      }),
    });

    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }

    const result = await response.json();
    console.log('服务器响应:', result);
    return result;
  } catch (error) {
    console.error('保存NFT数据出错:', error);
    throw error;
  }
};

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
    isListed: false,
  });
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // IPFS上传相关状态
  const [loading, setLoading] = useState(false);
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageData, setImageData] = useState<{ id: number, name: string, onChainAddress: string }[]>([]);
  const [pixelatedDataUrl, setPixelatedDataUrl] = useState<string | null>(null);
  const [tempPixelatedUrl, setTempPixelatedUrl] = useState<string | null>(null);

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
    const storedNFTs = localStorage.getItem("createdNFTs");
    if (storedNFTs) {
      setCreatedNFTs(JSON.parse(storedNFTs));
    }

    // 加载已上传的图片数据
    const data: { id: number, name: string, onChainAddress: string }[] = [];
    let id = 1;
    let storedData = localStorage.getItem(`image_${id}`);
    while (storedData) {
      data.push(JSON.parse(storedData));
      id++;
      storedData = localStorage.getItem(`image_${id}`);
    }
    setImageData(data);
  }, [connectedAddress]);

  // NFT信息变更处理
  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftInfo({
      ...nftInfo,
      [name]: name === "attributes" ? value.split(",").map((attr) => ({ trait_type: name, value: attr })) : value,
    });
  };

  // 修改图片选择处理函数
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImage(file);
      // 创建预览URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // 重置像素化图片状态
      setPixelatedDataUrl(null);
      setTempPixelatedUrl(null);
    }
  };

  // 修改像素化处理回调
  const handlePixelated = (pixelatedUrl: string) => {
    setTempPixelatedUrl(pixelatedUrl);
  };

  // 添加确认使用函数
  const handleConfirmPixelated = () => {
    if (tempPixelatedUrl) {
      setPixelatedDataUrl(tempPixelatedUrl);
      setIsPixelateModalOpen(false);
    }
  };

  // 添加取消函数
  const handleCancelPixelated = () => {
    setTempPixelatedUrl(null);
    setIsPixelateModalOpen(false);
  };

  // 修改 IPFS 上传处理函数
  const handleIpfsUpload = async () => {
    if (!pixelatedDataUrl) {
      notification.error("请等待图片像素化处理完成");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("上传至IPFS中...");
    try {
      // 将 base64 转换为文件
      const response = await fetch(pixelatedDataUrl);
      const blob = await response.blob();
      const pixelatedFile = new File([blob], 'pixelated.png', { type: 'image/png' });

      const imageUploadedItem = await uploadToPinata(pixelatedFile);

      notification.remove(notificationId);
      notification.success("已上传到IPFS");

      setUploadedIpfsPath(imageUploadedItem.IpfsHash);

      // 存储上传的图片详情
      const newImageData = {
        id: imageData.length + 1,
        name: 'pixelated.png',
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
        const newNftInfo: NftInfo = {
          ...nftInfo,
          id: newId,
          owner: connectedAddress || "",
          CID: uploadedItem.CID,
          isListed: false
        };

        // 保存到数据库
        await saveNFTToDatabase(newNftInfo);
        notification.success("NFT创建成功并保存到数据库");

        setCreatedNFTs((prevNFTs) => {
          const updatedNFTs = [...prevNFTs, newNftInfo];
          localStorage.setItem("createdNFTs", JSON.stringify(updatedNFTs));
          return updatedNFTs;
        });

        setNftInfo({
          image: "",
          id: Date.now(),
          name: "",
          attributes: [],
          owner: connectedAddress || "",
          price: "",
          description: "",
          isListed: false
        });
      } else {
        notification.error("无法获取TokenIdCounter");
      }
    } catch (error) {
      notification.remove(notificationId);
      console.error("创建NFT出错: ", error);
      notification.error(error instanceof Error ? error.message : "创建NFT失败");
    }
  };

  // 添加模态框状态
  const [isImageListOpen, setIsImageListOpen] = useState(false);
  const [isPixelateModalOpen, setIsPixelateModalOpen] = useState(false);

  // 添加处理图片选择的函数
  const handleImageSelect = async (ipfsHash: string) => {
    try {
      // 获取IPFS图片
      const imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // 创建File对象
      const file = new File([blob], 'selected-image.png', { type: blob.type });
      setImage(file);
      
      // 设置预览URL
      setPreviewUrl(imageUrl);
      
      // 重置像素化状态
      setPixelatedDataUrl(null);
      setTempPixelatedUrl(null);
      
      // 关闭图片列表模态框
      setIsImageListOpen(false);
      
      notification.success("Image selected successfully");
    } catch (error) {
      notification.error("Failed to load selected image");
      console.error(error);
    }
  };

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
              <div className="border border-dashed border-[#3d2b85] rounded-2xl m-1.5 flex flex-col">
                {/* 上传区域 */}
                <div className="h-[160px] flex flex-col items-center justify-center">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.glb"
                    id="file-upload"
                    required
                  />
                  <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center hover:bg-[#2a1a70]/30 transition-colors">
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

                {/* 像素化预览按钮 */}
                {image && (
                  <div className="px-4 py-3 border-t border-[#3d2b85]">
                    <button
                      onClick={() => setIsPixelateModalOpen(true)}
                      className="w-full bg-[#2a1a70] text-white py-3 px-4 rounded-xl hover:bg-[#342180] transition-colors flex items-center justify-center gap-2"
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
                      像素化预览
                    </button>
                  </div>
                )}

                {/* 查看已上传图片按钮 */}
                <div className="px-4 py-3 border-t border-[#3d2b85]">
                  <button
                    onClick={() => setIsImageListOpen(true)}
                    className="w-full bg-[#2a1a70] text-white py-3 px-4 rounded-xl hover:bg-[#342180] transition-colors flex items-center justify-center gap-2"
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

                {/* 底部区域：文件大小限制和上传按钮 */}
                <div className="flex justify-between items-center p-4 border-t border-[#3d2b85]">
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
          </div>

          {/* 像素化预览模态框 */}
          {isPixelateModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[#231564] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">像素化预览</h2>
                  <button
                    onClick={handleCancelPixelated}
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

                <PixelNft
                  originalImage={image}
                  onPixelated={handlePixelated}
                />

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCancelPixelated}
                    className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors mr-4"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmPixelated}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    disabled={!tempPixelatedUrl}
                  >
                    确认使用
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 右侧预览区域 */}
          <div className="w-[400px]">
            <div className="sticky top-8">
              <h2 className="text-3xl font-bold text-[#9d8ec4] mb-6 font-[Space Grotesk]">Preview Item</h2>
              <div className="bg-[#231564] rounded-3xl overflow-hidden shadow-xl">
                <div className="aspect-square relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      style={{ 
                        imageRendering: 'auto',
                        filter: pixelatedDataUrl ? 'blur(2px) opacity(0.3)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-[#1a1147]">
                      No media to preview
                    </div>
                  )}

                  {/* 像素化图片叠加层 */}
                  {pixelatedDataUrl && (
                    <img
                      src={pixelatedDataUrl}
                      alt="Pixelated Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ 
                        imageRendering: 'pixelated',
                        animation: 'fadeIn 0.3s ease-in-out'
                      }}
                    />
                  )}
                  
                  {/* 创建者头像 - 左下角 */}
                  {nftInfo.name && (
                    <div className="absolute left-4 -bottom-6 w-12 h-12 rounded-full border-4 border-[#231564] overflow-hidden">
                      <img
                        src="/profile.jpg"
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
                            className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageSelect(row.onChainAddress)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleImageSelect(row.onChainAddress)}
                              className="px-3 py-1 bg-purple-600/20 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors text-sm"
                            >
                              Use Image
                            </button>
                            <a
                              href={`https://ipfs.io/ipfs/${row.onChainAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-[#1a1147] rounded-lg text-gray-400 hover:text-white transition-colors text-sm"
                            >
                              View on IPFS
                            </a>
                          </div>
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

      {/* 添加动画样式 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateNFT;
