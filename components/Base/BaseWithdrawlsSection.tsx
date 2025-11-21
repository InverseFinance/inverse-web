import { useState } from "react";
import { Stack } from "@chakra-ui/react";
import { BaseTransactions } from "./BaseTransactions";
import { BaseWithdraw } from "./BaseWithdraw";
import { WithdrawalItem } from "@app/util/base";
import { useWeb3React } from "@app/util/wallet";

export const BaseWithdrawlsSection = () => {
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
        <BaseTransactions refreshIndex={refreshIndex} w={{ base: 'full', lg: '55%' }} onClick={selectTransaction} />
        {
            chainId === 1 && <BaseWithdraw onSuccess={onSuccess} w={{ base: 'full', lg: '45%' }} transactionItem={selectedItem} />
        }
    </Stack>
}