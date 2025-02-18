"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
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

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [filteredNFTs, setFilteredNFTs] = useState<NftInfo[]>([]);

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

  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftInfo({
      ...nftInfo,
      [name]: name === "attributes" ? value.split(",").map((attr) => ({ trait_type: name, value: attr })) : value,
    });
  };

  const handleMintItem = async () => {
    const { image, id, name, attributes, owner, price, description } = nftInfo;
    console.log("开始创建 NFT，初始数据:", nftInfo);

    if (image === "") {
      notification.error("请提供图片链接");
      return;
    }

    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const uploadedItem = await addToIPFS({ image, id, name, attributes, owner, price, description });
      console.log("IPFS 上传结果:", uploadedItem);

      notification.remove(notificationId);
      notification.success("数据已上传到IPFS中");

      if (tokenIdCounter !== undefined) {
        await mintItem({
          args: [connectedAddress, uploadedItem.path],
        });

        const newId = Number(tokenIdCounter) + 1;
        
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
          const response = await axios.post('http://localhost:4000/mintNFT', nftData, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log("服务器响应:", response.data);
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

        const newNftInfo: NftInfo = {
          ...nftInfo,
          id: newId,
          owner: connectedAddress || "",
          CID: uploadedItem.CID,
        };
        setCreatedNFTs(prev => [...prev, newNftInfo]);

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
          setFilteredNFTs(nfts);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
        }
      }
    };

    fetchNFTs();
  }, [connectedAddress]);

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">我的NFT列表</span>
          </h1>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
          创建NFT
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg relative">
            <button className="absolute right-3 top-3 text-lg" onClick={() => setIsModalOpen(false)} style={{ color: "black" }}>
              -
            </button>
            <div>
              <input
                type="text"
                name="image"
                placeholder="NFT 链接"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.image}
                onChange={handleNftInfoChange}
              />
              <input
                type="text"
                name="name"
                placeholder="NFT 名称"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.name}
                onChange={handleNftInfoChange}
              />
              <input
                type="text"
                name="attributes"
                placeholder="NFT 属性（用逗号分隔）"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.attributes.map((attr) => attr.value).join(",")}
                onChange={handleNftInfoChange}
              />
              <input
                type="text"
                name="price"
                placeholder="NFT 价格信息"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.price}
                onChange={handleNftInfoChange}
              />
              <input
                type="text"
                name="description"
                placeholder="NFT 描述信息"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.description}
                onChange={handleNftInfoChange}
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                className="btn btn-secondary mr-4"
                onClick={() => {
                  setIsModalOpen(false);
                  setNftInfo({
                    image: "",
                    id: Date.now(),
                    name: "",
                    attributes: [],
                    owner: connectedAddress || "",
                    price: "",
                    description: "",
                  });
                }}
              >
                取消
              </button>
              <div className="flex justify-center">
                {!isConnected || isConnecting ? (
                  <RainbowKitCustomConnectButton />
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleMintItem();
                      setIsModalOpen(false);
                    }}
                  >
                    创建 NFT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MyHoldings filteredNFTs={filteredNFTs} />
    </>
  );
};

export default MyNFTs;
