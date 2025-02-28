import { WriteContractResult, getPublicClient } from "@wagmi/core";
import { Hash, SendTransactionParameters, TransactionReceipt, WalletClient } from "viem";
import { useWalletClient } from "wagmi";
import { getBlockExplorerTxLink, getParsedError, notification } from "~~/utils/scaffold-eth";

type TransactionFunc = (
  tx: (() => Promise<WriteContractResult>) | (() => Promise<Hash>) | SendTransactionParameters,
  options?: {
    onBlockConfirmation?: (txnReceipt: TransactionReceipt) => void;
    blockConfirmations?: number;
  },
) => Promise<Hash | undefined>;

/**
 * Custom notification content for TXs.
 */
const TxnNotification = ({ message, blockExplorerLink }: { message: string; blockExplorerLink?: string }) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a href={blockExplorerLink} target="_blank" rel="noreferrer" className="block link text-md">
          check out transaction
        </a>
      ) : null}
    </div>
  );
};

/**
 * Runs Transaction passed in to returned function showing UI feedback.
 * @param _walletClient - Optional wallet client to use. If not provided, will use the one from useWalletClient.
 * @returns function that takes in transaction function as callback, shows UI feedback for transaction and returns a promise of the transaction hash
 */
export const useTransactor = (_walletClient?: WalletClient): TransactionFunc => {
  let walletClient = _walletClient;
  const { data } = useWalletClient();
  if (walletClient === undefined && data) {
    walletClient = data;
  }

  const result: TransactionFunc = async (tx, options) => {
    if (!walletClient) {
      notification.error("Cannot access account");
      console.error("⚡️ ~ file: useTransactor.tsx ~ error");
      return;
    }

    let notificationId = null;
    let transactionHash: Awaited<WriteContractResult>["hash"] | undefined = undefined;
    try {
      const network = await walletClient.getChainId();
      // Get full transaction from public client
      const publicClient = getPublicClient();

      notificationId = notification.loading(<TxnNotification message="Awaiting for user confirmation" />);
      if (typeof tx === "function") {
        // Tx is already prepared by the caller
        const result = await tx();
        if (typeof result === "string") {
          transactionHash = result;
        } else {
          transactionHash = result.hash;
        }
      } else if (tx != null) {
        transactionHash = await walletClient.sendTransaction(tx);
      } else {
        throw new Error("Incorrect transaction passed to transactor");
      }
      notification.remove(notificationId);

      const blockExplorerTxURL = network ? getBlockExplorerTxLink(network, transactionHash) : "";

      notificationId = notification.loading(
        <TxnNotification message="Waiting for transaction to complete." blockExplorerLink={blockExplorerTxURL} />,
      );

      const transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: options?.blockConfirmations,
      });
      notification.remove(notificationId);

      const processTransaction = async (tx: TransactionReceipt) => {
        try {
          const resolvedTx = await tx;
          
          // 等待交易确认
          const txResult = await waitForTransaction({
            hash: resolvedTx,
          });

          // 先显示自定义的成功通知
          if (notifications.success) {
            notifications.success(txResult);
          }

          // 显示合并后的成功通知
          notification.success({
            message: 'NFT购买成功',
            description: (
              <div className="flex flex-col gap-3">
                <div className="text-green-400">NFT已成功转移到您的账户</div>
                <div className="success-checkmark">
                  <div className="check-icon">
                    <span className="icon-line line-tip"></span>
                    <span className="icon-line line-long"></span>
                    <div className="icon-circle"></div>
                    <div className="icon-fix"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[#10B981]">
                  <span className="text-lg">🎉</span>
                  <div className="flex flex-col">
                    <span className="font-medium">交易成功!</span>
                    <a href={blockExplorerTxURL} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-sm hover:text-[#047857] transition-colors">
                      check out transaction
                    </a>
                  </div>
                </div>
              </div>
            ),
            className: 'purchase-success-notification',
            duration: 3.5,
            placement: 'top',
            style: {
              background: 'rgba(35, 21, 100, 0.95)',
              borderLeft: '4px solid #10B981',
              backdropFilter: 'blur(10px)',
            },
            onClose: () => {
              // 通知关闭后刷新页面
              window.location.reload();
            }
          });

          return resolvedTx;
        } catch (error) {
          // ... 错误处理保持不变
        }
      };

      if (options?.onBlockConfirmation) options.onBlockConfirmation(transactionReceipt);
    } catch (error: any) {
      if (notificationId) {
        notification.remove(notificationId);
      }
      console.error("⚡️ ~ file: useTransactor.ts ~ error", error);
      const message = getParsedError(error);
      notification.error(message);
      throw error;
    }

    return transactionHash;
  };

  return result;
};
