import { MULTISIG_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";
import { useWeb3React } from "@web3-react/core";
import { GnosisSafe } from "@web3-react/gnosis-safe";
import { Contract } from "ethers";
import useSWR from "swr";
import useEtherSWR from "./useEtherSWR";

const { F2_CONTROLLER } = getNetworkConfigConstants();

export const useMultisig = (borrowController?: string): {
    isSafeMultisigConnector: boolean,
    isMultisig: boolean,
    isWhitelisted: boolean,    
} => {
    const { connector, account, provider } = useWeb3React();
    const { data, error } = useSWR(`is-multisig-${account}`, async () => {
        if(!account || !provider) return undefined;
        const contract = new Contract(account, MULTISIG_ABI, provider.getSigner());
        const owners = await contract.getOwners();
        return Array.isArray(owners);
    }, {
        shouldRetryOnError: false,
    });
    const { data: isWhitelisted } = useEtherSWR([borrowController||F2_CONTROLLER, 'contractAllowlist', account]);
    if(!account || !connector) return { isSafeMultisigConnector: false, isMultisig: false, isWhitelisted: false };
    const isSafeConnector =  !!connector && connector instanceof GnosisSafe;
    if(isSafeConnector) return { isSafeMultisigConnector: true, isMultisig: true, isWhitelisted };
    return { isSafeMultisigConnector: false, isMultisig: !error && !!data, isWhitelisted }
}