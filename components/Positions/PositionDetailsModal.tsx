import { useState } from 'react';
import { Modal } from '@app/components/common/Modal';
import { Stack, Text } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { useRouter } from 'next/dist/client/router';
import { formatUnits } from 'ethers/lib/utils';
import { useBorrowedAssets, useSuppliedCollaterals } from '@app/hooks/useBalances';
import { Funds } from '../Transparency/Funds';
import { useAnchorPrices } from '@app/hooks/usePrices';
import { StringNumMap } from '@app/types';
import { BigNumber } from 'ethers';

type Props = {
    account: string,
    isOpen: boolean
    onClose: () => void
}

export const PositionDetailsModal = ({
    account,
    isOpen,
    onClose,
}: Props) => {
    const collaterals = useSuppliedCollaterals(account);
    const borrowed = useBorrowedAssets(account);

    const borrowFunds = borrowed.map(b => ({...b, token: { ...b.underlying } }))

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            scrollBehavior={'outside'}
            header={
                <Stack minWidth={24} direction="row" align="center">
                    <Text>Position Details</Text>
                </Stack>
            }
        >
            <Stack p={'5'}>
                <Funds funds={borrowFunds} />
            </Stack>
        </Modal>
    )
}