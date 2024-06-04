import { useState } from "react";
import { Stack } from "@chakra-ui/react";
import { BlastTransactions } from "./BlastTransactions";
import { BlastWithdraw } from "./BlastWithdraw";
import { WithdrawalItem } from "@app/util/blast";
import { useWeb3React } from "@web3-react/core";

export const BlastWithdrawlsSection = () => {
    const { chainId } = useWeb3React();
    const [refreshIndex, setRefreshIndex] = useState(0);
    const [selectedItem, setSelectedItem] = useState<WithdrawalItem | undefined>(undefined);

    const selectTransaction = (item: any) => {
        setSelectedItem(item);
    }

    const onSuccess = () => {
        setRefreshIndex(refreshIndex+1);
    }
    
    return <Stack spacing="8" direction={{ base: 'column', 'xl': 'row' }} w='full'>
        <BlastTransactions refreshIndex={refreshIndex} w={{ base: 'full', lg: '55%' }} onClick={selectTransaction} />
        {
            chainId === 1 && <BlastWithdraw onSuccess={onSuccess} w={{ base: 'full', lg: '45%' }} transactionItem={selectedItem} />
        }
    </Stack>
}