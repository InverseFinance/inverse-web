import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { createThirdwebClient } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { useActiveWalletChain } from "thirdweb/react";
import { mainnet } from "thirdweb/chains";
import { useMemo, useState } from "react";
import { Web3Provider } from "@ethersproject/providers";

export const thirdwebClient = createThirdwebClient({
  clientId: "81cf69fe9cc66a36a319da14666b2bc7",
});

export const useThirdweb = (): {
  account: string | undefined;
  provider: Web3Provider | undefined;
  chainId: number | undefined;
  isActive: boolean;
  activeAccount: ReturnType<typeof useActiveAccount>;
  connector?: any;
} => {
  const [provider, setProvider] = useState<Web3Provider | undefined>(undefined);
  const activeAccount = useActiveAccount();
  const activeWalletChain = useActiveWalletChain();
  const account = activeAccount?.address;

  // const provider = ethers5Adapter.provider.toEthers({
  //   // account: activeAccount,
  //   client: thirdwebClient,
  //   chain: mainnet,
  // });

  useMemo(() => {
    if (!activeAccount || !activeWalletChain || !!provider) {
      return undefined;
    }
    const init = async () => {
      try {
        const ethersWallet = ethers5Adapter.provider.toEthers({
          // account: activeAccount,
          client: thirdwebClient,
          chain: activeWalletChain,
        });
        console.log(ethersWallet)
        // Create a Web3Provider from the wallet
        setProvider(ethersWallet);
        return ethersWallet
      } catch (e) {
        console.error("Error creating provider:", e);
        setProvider(undefined);
        return undefined;
      }
    }
    return init();
  }, [activeAccount, activeWalletChain]);

  return {
    account,
    provider,
    chainId: activeWalletChain?.id,
    isActive: !!account,
    activeAccount,
    connector: undefined, // thirdweb doesn't expose connector in the same way
  };
}

// Alias for backward compatibility
export const useWeb3React = useThirdweb;
