import { MULTISIG_ABI } from "@app/config/abis";
import { useWeb3React } from "@web3-react/core";
import { GnosisSafe } from "@web3-react/gnosis-safe";
import { Contract } from "ethers";
import useSWR from "swr";

export const useMultisig = () => {
    const { connector, account, provider } = useWeb3React();
    const { data, error } = useSWR(`is-multisig-${account}`, async () => {
        if(!account || !provider) return undefined;
        const contract = new Contract(account, MULTISIG_ABI, provider.getSigner());
        const owners = await contract.getOwners();
        return Array.isArray(owners);
    }, {
        shouldRetryOnError: false,
    });
    if(!account || !connector) return { isSafeMultisigConnector: false, isMultisig: false };
    const isSafeConnector =  !!connector && connector instanceof GnosisSafe;
    if(isSafeConnector) return { isSafeMultisigConnector: true, isMultisig: true };    
    return { isSafeMultisigConnector: false, isMultisig: !error && data }
}