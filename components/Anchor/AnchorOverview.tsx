import { Flex, Stack, Text, Badge } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { StyledButton } from '@inverse/components/common/Button'
import Container from '@inverse/components/common/Container'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAnchorRewards } from '@inverse/hooks/useAnchorRewards'
import { getComptrollerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { commify, formatUnits } from 'ethers/lib/utils'
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { TEST_IDS } from '@inverse/config/test-ids'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances';
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { Interests } from '@inverse/types'
import { getTotalInterests } from '@inverse/util/markets';
import { AnchorInterests } from './AnchorInterests'

export const AnchorOverview = () => {
  const { account, library, chainId } = useWeb3React<Web3Provider>()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()
  const { rewards } = useAnchorRewards()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { markets } = useMarkets()
  const { exchangeRates } = useExchangeRates()
  const { XINV } = getNetworkConfigConstants(chainId)

  const totalInterestsUsd: Interests = getTotalInterests(markets, supplyBalances, borrowBalances, exchangeRates, XINV);

  const rewardAmount = rewards ? parseFloat(formatUnits(rewards)) : 0
  const borrowLimitPercent = Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100)
  let badgeColorScheme
  let health
  if (borrowLimitPercent <= 25) {
    badgeColorScheme = 'green'
    health = 'Healthy'
  } else if (borrowLimitPercent <= 75) {
    badgeColorScheme = 'yellow'
    health = 'Moderate'
  } else {
    badgeColorScheme = 'red'
    health = 'Dangerous'
  }
  return (
    <Container
      label={
        <Flex pb={{ base: '0px', sm: '4px' }} textAlign="left" flexDirection={{ base: 'column', sm: 'row' }}>
          <Text mr="2">Banking</Text>
          {
            totalInterestsUsd?.total !== 0 && totalInterestsUsd?.total !== undefined ?
              <AnchorInterests {...totalInterestsUsd} />
              : null
          }
        </Flex>
      }
      right={
        <Stack direction={{ base: 'column-reverse', sm: 'row' }} align="center" textAlign="end">
          <Flex flexDirection="row" alignItems="center">
            <Text color="secondary" fontSize="14" mr="2" fontWeight="bold">
              {`${rewardAmount.toFixed(4)} INV`}
            </Text>
            <AnimatedInfoTooltip
              iconProps={{ boxSize: 3, mt: '2px' }}
              message="This represents the total amount of your accrued INV rewards across all incentivized pools. To earn rewards, deposit assets to a market that shows a positive Reward APY." />
          </Flex>
          <StyledButton
            isDisabled={!rewardAmount}
            onClick={() => getComptrollerContract(library?.getSigner()).claimComp(account)}
            data-testid={TEST_IDS.anchor.claim}
          >
            Claim
          </StyledButton>
        </Stack>
      }
    >
      <Flex w="full" justify="center">
        <Stack
          w="full"
          direction={{ base: 'column', sm: 'row' }}
          justify="center"
          align="center"
          spacing={2}
          fontSize="sm"
          fontWeight="semibold"
        >
          <Stack direction="row" align="center">
            <Flex whiteSpace="nowrap" color="purple.300" fontSize="sm">
              Borrow Limit
            </Flex>
            <AnimatedInfoTooltip message="Your borrow limit represents the maximum amount that you're allowed to borrow across all tokens. If you reach 100% of your borrow limit, you will get liquidated." />
            <Text>{`${usdBorrowable ? borrowLimitPercent : 0}%`}</Text>
          </Stack>
          <Flex w="full" h={1} borderRadius={8} bgColor="purple.850">
            <Flex w={`${borrowLimitPercent}%`} h="full" borderRadius={8} bgColor="purple.400"></Flex>
          </Flex>
          <Stack direction="row" align="center">
            <Text>{`$${usdBorrowable ? commify((usdBorrowable + usdBorrow).toFixed(2)) : '0.00'}`}</Text>
            {borrowLimitPercent > 0 && (
              <>
                <Badge variant="subtle" colorScheme={badgeColorScheme}>
                  {health}
                </Badge>
                <AnimatedInfoTooltip message="This badge indicates your current loan health. If your loan health shows as 'Dangerous' then your current debt is too close to your borrow limit. In this case, you should repay some loans or add more collateral to reduce your liquidation risk." />
              </>
            )}
          </Stack>
        </Stack>
      </Flex>
    </Container>
  )
}
