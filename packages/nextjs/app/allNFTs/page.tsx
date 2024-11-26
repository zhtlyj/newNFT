"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Modal, Button, notification, Pagination, Input } from "antd";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";

interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  description: string;
  CID: string;
}

interface ListedNftInfo {
  id: number;
  price: string;
}

const AllNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]);
  const [listedNFTs, setListedNFTs] = useState<ListedNftInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Collectible | null>(null);
  const [buyerAddresses, setBuyerAddresses] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]);
  const itemsPerPage = 6;

  const { writeAsync: purchase } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [0n, '', '', 0n, 0n], // 初始默认参数
  });

  useEffect(() => {
    const storedAllNFTs = localStorage.getItem("allNFTs");
    const storedListedNFTs = localStorage.getItem("listedNFTs");
    if (storedAllNFTs) {
      const nfts = JSON.parse(storedAllNFTs);
      setAllNFTs(nfts);
      setFilteredNFTs(nfts);
    }
    if (storedListedNFTs) {
      const listed = JSON.parse(storedListedNFTs);
      setListedNFTs(listed);
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === "") {
      setFilteredNFTs(allNFTs);
    } else {
      const filtered = allNFTs.filter((nft) =>
        nft.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredNFTs(filtered);
      setCurrentPage(1); // 重置到第一页
    }
  };

  useEffect(() => {
    const filtered = allNFTs.filter((nft) =>
      nft.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredNFTs(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [searchText, allNFTs]);

  const openModal = (nft: Collectible) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPriceById = (id: number) => {
    const listedNft = listedNFTs.find(nft => nft.id === id);
    return listedNft ? listedNft.price : "N/A";
  };

  const handlePurchase = async () => {
    if (!selectedNft || !buyerAddresses[selectedNft.id]) return;

    try {
      const price = getPriceById(selectedNft.id);
      const value = ethers.parseUnits(price, "ether"); // 价格转换为wei
      await purchase({
        args: [BigInt(selectedNft.id), selectedNft.owner, buyerAddresses[selectedNft.id], value, BigInt(1)],
        value, // 直接传递value参数
      });
      notification.success({ message: "购买成功" });

      // 删除 allNFTs 中的对应 NFT 信息
      const updatedAllNFTs = allNFTs.filter((nft) => nft.id !== selectedNft.id);
      setAllNFTs(updatedAllNFTs);
      localStorage.setItem("allNFTs", JSON.stringify(updatedAllNFTs));

      // 删除 listedNFTs 中的对应 NFT 信息
      const updatedListedNFTs = listedNFTs.filter((nft) => nft.id !== selectedNft.id);
      setListedNFTs(updatedListedNFTs);
      localStorage.setItem("listedNFTs", JSON.stringify(updatedListedNFTs));

      // 在 createdNFTs 数组中找到对应的 NFT 并更新其 Owner
      const storedCreatedNFTs = localStorage.getItem("createdNFTs");
      const createdNFTs = storedCreatedNFTs ? JSON.parse(storedCreatedNFTs) : [];
      const updatedCreatedNFTs = createdNFTs.map((nft: Collectible) =>
        nft.id === selectedNft.id ? { ...nft, owner: buyerAddresses[selectedNft.id] } : nft
      );
      localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs));

      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      notification.error({ message: "购买失败" });
    }
  };

  const handleBuyerAddressChange = (id: number, address: string) => {
    setBuyerAddresses(prevAddresses => ({
      ...prevAddresses,
      [id]: address,
    }));
  };

  // 分页后的数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">NFT市场</span>
          </h1>
          <div className="flex justify-center mb-8">
            <Input.Search
              placeholder="输入NFT名称"
              value={searchText}
              onChange={(e: any) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton
              style={{ width: 400 }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center">
          {paginatedNFTs.length === 0 ? (
            <div className="text-2xl text-primary-content">暂无在售NFT</div>
          ) : (
            paginatedNFTs.map((nft) => (
              <div
                key={nft.id}
                className="card card-compact bg-base-100 shadow-lg sm:min-w-[300px] shadow-secondary"
                style={{ margin: "1rem" }}
              >
                <figure className="relative">
                  <img
                    src={nft.image}
                    alt="NFT Image"
                    className="h-60 min-w-full"
                  />
                  <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
                    <span className="text-white"># {nft.id}</span>
                  </figcaption>
                </figure>
                <div className="card-body space-y-3">
                  <div className="flex items-center justify-center">
                    <p className="text-xl p-0 m-0 font-semibold">NFT名称：{nft.name}</p>
                    <div className="flex flex-wrap space-x-2 mt-1">
                      {nft.attributes.map((attr, index) => (
                        <span key={index} className="badge badge-primary py-3">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center mt-1">
                    <p className="my-0 text-lg">描述：{nft.description}</p>
                  </div>
                  <div className="flex space-x-3 mt-1 items-center">
                    <span className="text-lg font-semibold">发布者 : </span>
                    <Address address={nft.owner} />
                  </div>
                  {nft.CID && (
                    <div className="flex space-x-3 mt-1 items-center">
                      <span className="text-lg font-semibold">CID : </span>
                      <span>{nft.CID}</span>
                    </div>
                  )}
                  <div className="flex flex-col my-2 space-y-1">
                    <span className="text-lg font-semibold mb-1">购买账户地址: </span>
                    <Input
                      type="text"
                      placeholder="请填写您的账户地址"
                      className="input input-bordered w-full"
                      value={buyerAddresses[nft.id] || ""}
                      onChange={(e: any) => handleBuyerAddressChange(nft.id, e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-3 mt-1 items-center">
                    <span className="text-lg font-semibold">价格：{getPriceById(nft.id)} ETH </span>
                  </div>
                  <div className="card-actions justify-end">
                    <Button
                      type="primary"
                      className="btn btn-secondary btn-md px-8 tracking-wide"
                      onClick={() => openModal(nft)}
                      style={{ margin: "0px auto" }}
                    >
                      购买
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          current={currentPage}
          pageSize={itemsPerPage}
          total={filteredNFTs.length}
          onChange={handlePageChange}
          style={{ marginTop: "2rem", textAlign: "center" }}
        />
      </div>

      <Modal
        title="确认购买"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handlePurchase}
          >
            确认购买
          </Button>,
        ]}
      >
        {selectedNft && (
          <div>
            <p>您将购买以下NFT：</p>
            <p>名称: {selectedNft.name}</p>
            <p>价格: {getPriceById(selectedNft.id)} ETH</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AllNFTs;
