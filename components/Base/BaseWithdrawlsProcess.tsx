import { useState } from "react";
import { Stack } from "@chakra-ui/react";
import { BaseTransactions } from "./BaseTransactions";
import { BaseWithdraw } from "./BaseWithdraw";
import { WithdrawalItem } from "@app/util/base";
import { useWeb3React } from "@web3-react/core";

export const BaseWithdrawlsProcess = () => {
    const { chainId } = useWeb3React();
    const [selectedItem, setSelectedItem] = useState<WithdrawalItem | undefined>(undefined);

    const selectTransaction = (item: any) => {
        setSelectedItem(item);
    }
    
    return <Stack direction={{ base: 'column', 'xl': 'row' }} w='full'>
        <BaseTransactions onClick={selectTransaction} />
        {
            chainId === 1 && <BaseWithdraw transactionItem={selectedItem} />
        }
    </Stack>
}