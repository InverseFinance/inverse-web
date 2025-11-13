import { useState } from 'react';
import { Modal } from '@app/components/common/Modal';
import { Checkbox, CheckboxGroup, Stack, Text, Box, VStack } from '@chakra-ui/react';
import { SubmitButton } from '@app/components/common/Button';
import { useMarkets } from '@app/hooks/useMarkets';
import { useSupplyBalances } from '@app/hooks/useBalances';
import { getBnToNumber, getParsedBalance } from '@app/util/markets';
import { claimInvRewards } from '@app/util/contracts';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@app/components/common/Messages';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { REWARD_TOKEN } from '@app/variables/tokens';

const { COMPTROLLER, INV, TREASURY } = getNetworkConfigConstants();

type Props = {
    rewardAmount: number,
    isOpen: boolean
    onClose: () => void
}

export const AnchorClaimModal = ({
    rewardAmount,
    isOpen,
    onClose,
}: Props) => {
    const { provider, account } = useWeb3React<Web3Provider>()
    const { markets, isLoading: marketsLoading } = useMarkets()
    const { balances: supplyBalances, isLoading: balancesLoading } = useSupplyBalances()
    const [checkedMarkets, setCheckedMarkets] = useState<string[]>([]);
    const { data: rewardsAllowance } = useEtherSWR([
        INV, 'allowance', TREASURY, COMPTROLLER,
    ])

    const close = () => {
        onClose()
        setCheckedMarkets([])
    }

    const handleClaim = () => {
        return claimInvRewards(provider?.getSigner()!, checkedMarkets, { onSuccess: () => close() })
    }

    const handleCheck = (marketAddresses: string[]) => {
        setCheckedMarkets(marketAddresses)
    }

    const hadRewardsInThePast = ['xSUSHI', 'WBTC-v1', 'YFI-v1', 'FLOKI', 'ETH-v1', 'DOLA-3POOL', 'INV-DOLA-SLP'];
    const checkboxesWithBalance = markets
        .filter(market => (market.rewardApr > 0 || hadRewardsInThePast.includes(market.underlying.symbol)) && getParsedBalance(supplyBalances, market.token, market.underlying.decimals) > 0)
        .map(market => <Checkbox w='200px' key={market.token} value={market.token}>
            {market.underlying.symbol}
        </Checkbox>)

    const checkboxesWithoutBalance = markets
        .filter(market => (market.rewardApr > 0 || hadRewardsInThePast.includes(market.underlying.symbol)) && getParsedBalance(supplyBalances, market.token, market.underlying.decimals) === 0)
        .map(market => <Checkbox w='200px' key={market.token} value={market.token}>
            {market.underlying.symbol}
        </Checkbox>)

    const notEnoughAllowance = rewardAmount > (getBnToNumber(rewardsAllowance || 0, REWARD_TOKEN!.decimals));
    const isDisabled = !checkedMarkets.length || marketsLoading || balancesLoading || !account || notEnoughAllowance;

    return (
        <Modal
            onClose={close}
            isOpen={isOpen}
            header={
                <Stack minWidth={24} direction="row" align="center" >
                    <Text>Claim up to {rewardAmount.toFixed(4)} {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards</Text>
                </Stack>
            }
            footer={
                <VStack w='full'>
                    <SubmitButton disabled={isDisabled} onClick={handleClaim} refreshOnSuccess={true}>
                        Claim
                    </SubmitButton>
                    {
                        notEnoughAllowance && <InfoMessage
                            alertProps={{ fontSize: '12px', w: 'full' }}
                            title="Frontier's INV available Rewards too low"
                            description="Claiming is temporarily unavailable at the moment as we need to replenish Frontier with INV tokens, please check the Governance page for more infos on the on-going process"
                        />
                    }
                </VStack>
            }
        >
            <CheckboxGroup colorScheme='green' defaultValue={[]} value={checkedMarkets} onChange={handleCheck}>
                <Box p="5" textAlign="left" justifyContent="left" w="full">
                    <Text mb="4" fontSize="14px">
                        Pools giving {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards (or used to give it) where you have <b>supplied tokens</b> :
                    </Text>
                    {checkboxesWithBalance}
                    {!checkboxesWithBalance.length ? 'None' : ''}
                    {
                        checkboxesWithoutBalance?.length > 0 &&
                        <>
                            <Text my="4" fontSize="14px">
                                Other pools giving {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards (or used to give it) :
                            </Text>
                            {checkboxesWithoutBalance}
                        </>
                    }
                    <InfoMessage alertProps={{ fontSize: '12px', mt: '9' }}
                        description={`You may have ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards in a pool where you no longer have supplied tokens. The gas cost varies according to the number of pools to claim.`}
                    />
                </Box>
            </CheckboxGroup>
        </Modal>
    )
}