// import { useEffect, useState, useRef } from "react";
// import { useDeployedContractInfo, useScaffoldContract } from "~~/hooks/scaffold-eth";
// import { usePublicClient } from "wagmi";
// import { Log } from "viem";

// export const useScaffoldBatchEventHistory = ({
//   contractName,
//   eventName,
//   fromBlock,
//   toBlock,
//   blockInterval = 5000,
//   enabled = true,
// }: {
//   contractName: string;
//   eventName: string;
//   fromBlock: bigint;
//   toBlock?: bigint;
//   blockInterval?: number;
//   enabled?: boolean;
// }) => {
//   const [events, setEvents] = useState<Log[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);
  
//   // 添加缓存引用
//   const eventsCache = useRef<{[key: string]: Log[]}>({});
//   const lastFetchTime = useRef<{[key: string]: number}>({});

//   const { data: deployedContractData } = useDeployedContractInfo(contractName);
//   const { data: contract } = useScaffoldContract({
//     contractName,
//     caller: "useScaffoldEventHistory",
//   });
//   const publicClient = usePublicClient();

//   useEffect(() => {
//     const fetchEvents = async () => {
//       if (!enabled || !deployedContractData || !contract) {
//         setIsLoading(false);
//         return;
//       }

//       // 生成缓存键
//       const cacheKey = `${contractName}-${eventName}-${fromBlock}`;
      
//       // 检查缓存是否存在且未过期（5分钟过期）
//       const now = Date.now();
//       if (
//         eventsCache.current[cacheKey] &&
//         lastFetchTime.current[cacheKey] &&
//         now - lastFetchTime.current[cacheKey] < 5 * 60 * 1000
//       ) {
//         setEvents(eventsCache.current[cacheKey]);
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);

//         const currentBlock = await publicClient.getBlockNumber();
//         const endBlock = toBlock || currentBlock;
//         let currentFromBlock = fromBlock;
//         let allEvents: Log[] = [];

//         // 找到指定的事件ABI
//         const eventAbi = contract.abi.find(
//           x => x.type === "event" && x.name === eventName
//         );

//         if (!eventAbi) {
//           throw new Error(`Event ${eventName} not found in contract ABI`);
//         }

//         while (currentFromBlock <= endBlock) {
//           const currentToBlock = currentFromBlock + BigInt(blockInterval);
//           const actualToBlock = currentToBlock > endBlock ? endBlock : currentToBlock;

//           try {
//             const events = await publicClient.getLogs({
//               address: deployedContractData?.address,
//               event: eventAbi,
//               fromBlock: currentFromBlock,
//               toBlock: actualToBlock,
//             });

//             allEvents = [...allEvents, ...events];
//           } catch (err) {
//             console.error(`Error fetching logs for block range ${currentFromBlock}-${actualToBlock}:`, err);
//           }

//           currentFromBlock = actualToBlock + BigInt(1);
//         }

//         // 更新缓存
//         eventsCache.current[cacheKey] = allEvents;
//         lastFetchTime.current[cacheKey] = now;
        
//         setEvents(allEvents);
//       } catch (err) {
//         setError(err instanceof Error ? err : new Error("Unknown error"));
//         console.error("Error fetching events:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchEvents();
//   }, [
//     contractName,
//     eventName,
//     fromBlock,
//     toBlock,
//     enabled,
//     deployedContractData,
//     contract,
//     publicClient,
//     blockInterval,
//   ]);

//   return {
//     data: events,
//     isLoading,
//     error,
//   };
// }; 