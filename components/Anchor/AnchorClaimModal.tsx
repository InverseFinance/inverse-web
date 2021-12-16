import { useState } from 'react';
import { Modal } from '@inverse/components/common/Modal';
import { Checkbox, CheckboxGroup, Flex, Stack, Text, VStack } from '@chakra-ui/react';
import { SubmitButton } from '@inverse/components/common/Button';
import { useAccountMarkets } from '@inverse/hooks/useMarkets';
import { useSupplyBalances } from '@inverse/hooks/useBalances';
import { getParsedBalance } from '@inverse/util/markets';
import { getComptrollerContract } from '@inverse/util/contracts';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { handleTx } from '@inverse/util/transactions';

type Props = {
    isOpen: boolean
    onClose: () => void
}

export const AnchorClaimModal = ({
    isOpen,
    onClose,
}: Props) => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { markets: accountMarkets, isLoading: marketsLoading } = useAccountMarkets()
    const { balances: supplyBalances, isLoading: balancesLoading } = useSupplyBalances()
    const [checkedMarkets, setCheckedMarkets] = useState<string[]>([]);

    if (marketsLoading || balancesLoading || !account) { return <></> }

    const handleClaim = async () => {
        const tx =  await getComptrollerContract(library?.getSigner()).claimComp(account, checkedMarkets);
        return handleTx(tx, { onSuccess: () => onClose() })
    }

    const handleCheck = (marketAddresses: string[]) => {
        setCheckedMarkets(marketAddresses)
    }

    const checkboxes = accountMarkets
        .filter(market => market.rewardApy > 0 && getParsedBalance(supplyBalances, market.token, market.underlying.decimals) > 0)
        .map(market => <Checkbox w='200px' key={market.token} value={market.token}>
            {market.underlying.symbol}
        </Checkbox>)

    const isDisabled = !checkedMarkets.length;

    return (
        <Modal
            onClose={onClose}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Claim INV rewards</Text>
                </Stack>
            }
            footer={
                <SubmitButton disabled={isDisabled} onClick={handleClaim}>
                    Claim
                </SubmitButton>
            }
        >
            <Stack spacing={'4'} p={'5'}>
                <Text>Asset Pools with Claimable INV Rewards : </Text>
                <Flex w="200px" pl="10">
                    <CheckboxGroup colorScheme='green' defaultValue={[]} value={checkedMarkets} onChange={handleCheck}>
                        <VStack textAlign="left" justifyContent="left" w="full">
                            {checkboxes}
                        </VStack>
                    </CheckboxGroup>
                </Flex>
            </Stack>
        </Modal>
    )
}