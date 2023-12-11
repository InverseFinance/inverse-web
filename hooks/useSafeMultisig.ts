import { useWeb3React } from "@web3-react/core";
import { GnosisSafe } from "@web3-react/gnosis-safe";

export const useMultisig = () => {
    const { connector, account } = useWeb3React();
    if(!account || !connector) return { isSafeMultisigConnector: false, isMultisig: false };
    const isSafeConnector =  !!connector && connector instanceof GnosisSafe;
    if(isSafeConnector) return { isSafeMultisigConnector: true, isMultisig: true };
    return { isSafeMultisigConnector: false, isMultisig: false }
}