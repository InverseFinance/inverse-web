import { useState } from "react";
import { Stack } from "@chakra-ui/react";
import { BaseTransactions } from "./BaseTransactions";
import { BaseWithdraw } from "./BaseWithdraw";
import { WithdrawalItem } from "@app/util/base";

export const BaseWithdrawlsProcess = () => {
    const [selectedItem, setSelectedItem] = useState<WithdrawalItem | undefined>(undefined);

    const selectTransaction = (item: any) => {
        setSelectedItem(item);
    }
    
    return <Stack direction={{ base: 'column', 'xl': 'row' }} w='full'>
        <BaseTransactions onClick={selectTransaction} />
        <BaseWithdraw transactionItem={selectedItem} />
    </Stack>
}