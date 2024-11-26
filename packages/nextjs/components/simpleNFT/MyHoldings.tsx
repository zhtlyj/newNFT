import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification, message, Switch, Pagination } from "antd";

export interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  uri?: string;
  tokenId?: number;
  CID?: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [isListed, setIsListed] = useState<{ [key: number]: boolean }>({});
  const [price, setPrice] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  const { data: myTotalBalance } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  const broadcastChannel = new BroadcastChannel('nft_channel');

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (myTotalBalance === undefined || yourCollectibleContract === undefined || connectedAddress === undefined) return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];

      const storedNFTs = localStorage.getItem("createdNFTs");
      let userNFTs: Collectible[] = [];
      if (storedNFTs) {
        const nfts = JSON.parse(storedNFTs);
        userNFTs = nfts.filter((nft: Collectible) => nft.owner === connectedAddress);
      }

      const totalBalance = parseInt(myTotalBalance.toString());

      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([connectedAddress, BigInt(tokenIndex)]);

          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);

          const localNFT = userNFTs.find((nft: Collectible) => nft.id === parseInt(tokenId.toString()));

          if (localNFT) {
            collectibleUpdate.push({
              ...localNFT,
              uri: tokenURI,
              tokenId: parseInt(tokenId.toString()),
            });
          }
        } catch (e) {
          setAllCollectiblesLoading(false);
          console.log(e);
        }
      }

      collectibleUpdate.push(...userNFTs.filter(nft => !collectibleUpdate.find(item => item.id === nft.id)));

      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateMyCollectibles();

    broadcastChannel.onmessage = (event) => {
      const newNFT = event.data;
      const storedNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
      const updatedNFTs = [...storedNFTs, newNFT];
      localStorage.setItem("createdNFTs", JSON.stringify(updatedNFTs));
      setMyAllCollectibles(prevCollectibles => [...prevCollectibles, newNFT]);
    };

    const interval = setInterval(updateMyCollectibles, 20000); // 每20秒轮询一次

    const storedListedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");
    const listedState: { [key: number]: boolean } = {};
    const priceState: { [key: number]: string } = {};
    storedListedNFTs.forEach((nft: { id: number, price: string }) => {
      listedState[nft.id] = true;
      priceState[nft.id] = nft.price;
    });
    setIsListed(listedState);
    setPrice(priceState);

    return () => {
      clearInterval(interval); // 在组件卸载时清除轮询
      broadcastChannel.close(); // 关闭广播通道
    };
  }, [connectedAddress, myTotalBalance]);

  const handleTransferSuccess = (id: number) => {
    setMyAllCollectibles(prevCollectibles => prevCollectibles.filter(item => item.id !== id));
  };

  const handleListToggle = async (checked: boolean, id: number) => {
    const storedNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
    let allNFTs = JSON.parse(localStorage.getItem("allNFTs") || "[]");

    if (checked) {
      if (!price[id]) {
        message.error("请设置价格");
        return;
      }
      const listedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");
      listedNFTs.push({ id, price: price[id] });
      localStorage.setItem("listedNFTs", JSON.stringify(listedNFTs));

      const nft = storedNFTs.find((nft: Collectible) => nft.id === id);
      if (nft) {
        allNFTs.push({ ...nft, isListed: true });
        localStorage.setItem("allNFTs", JSON.stringify(allNFTs));
      }

      message.success("上架成功");
    } else {
      const listedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");
      const updatedNFTs = listedNFTs.filter((item: { id: number }) => item.id !== id);
      localStorage.setItem("listedNFTs", JSON.stringify(updatedNFTs));

      allNFTs = allNFTs.filter((nft: Collectible) => nft.id !== id);
      localStorage.setItem("allNFTs", JSON.stringify(allNFTs));

      message.success("下架成功");
    }
    setIsListed(prev => ({ ...prev, [id]: checked }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedNFTs = myAllCollectibles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {paginatedNFTs.map((item) => (
            <div key={item.id}>
              <NFTCard nft={item} onTransferSuccess={handleTransferSuccess} />
              <div className="card-actions justify-center">
                <div className="flex flex-row items-center">
                  <span className="mr-3">上架</span>
                  <Switch checked={isListed[item.id] || false} onChange={(checked: any) => handleListToggle(checked, item.id)} />
                  <input
                    type="text"
                    value={price[item.id] || ""}
                    onChange={(e) => setPrice(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Price in ETH"
                    disabled={isListed[item.id]}
                    className="border ml-3 p-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        current={currentPage}
        pageSize={itemsPerPage}
        total={myAllCollectibles.length}
        onChange={handlePageChange}
        style={{ marginTop: "2rem", textAlign: "center" }}
      />
    </>
  );
};
