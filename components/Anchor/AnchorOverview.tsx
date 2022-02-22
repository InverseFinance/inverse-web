import { Flex, Stack, Text, Badge, useDisclosure } from '@chakra-ui/react'
import { StyledButton } from '@app/components/common/Button'
import Container from '@app/components/common/Container'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useAnchorRewards } from '@app/hooks/useAnchorRewards'
import { commify, formatUnits } from 'ethers/lib/utils'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { TEST_IDS } from '@app/config/test-ids'
import { useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances';
import { useExchangeRates } from '@app/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@app/hooks/useMarkets'
import { Interests } from '@app/types'
import { getTotalInterests } from '@app/util/markets';
import { AnchorInterests } from './AnchorInterests'
import { usePrices } from '@app/hooks/usePrices'
import { AnchorClaimModal } from './AnchorClaimModal'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import { PositionSlideWrapper } from '@app/components/Positions/PositionSlideWrapper'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { useState } from 'react'

export const AnchorOverview = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { usdBorrow, usdBorrowable, usdShortfall } = useAccountLiquidity()
  const { markets: accountMarkets } = useAccountMarkets()
  const { rewards } = useAnchorRewards()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { markets } = useMarkets()
  const { exchangeRates } = useExchangeRates()
  const { prices } = usePrices()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
  const [isDetailsSlidedDown, setIsDetailsSlidedDown] = useState(isDetailsOpen);

  const invPriceUsd = prices[RTOKEN_CG_ID]?.usd || 0;
  const totalInterestsUsd: Interests = getTotalInterests(markets, supplyBalances, borrowBalances, exchangeRates, invPriceUsd);

  const rewardAmount = rewards ? parseFloat(formatUnits(rewards)) : 0
  const borrowTotal = usdBorrowable + usdBorrow;

  // ignore dust
  const borrowLimitPercent = usdBorrow > 0.01 ? Math.floor((usdBorrow / (borrowTotal)) * 100) : 0
  let badgeColorScheme
  let health

  const hasCollaterals = accountMarkets.length > 0;

  if (!hasCollaterals) {
    badgeColorScheme = 'gray'
    health = 'NO COLLATERAL'
  }
  else if (usdShortfall > 75) {
    badgeColorScheme = 'red'
    health = 'Shortfall'
  }
  else if (borrowLimitPercent <= 25) {
    badgeColorScheme = 'green'
    health = 'Healthy'
  } else if (borrowLimitPercent <= 75) {
    badgeColorScheme = 'yellow'
    health = 'Moderate'
  } else if (borrowLimitPercent > 75) {
    badgeColorScheme = 'red'
    health = 'Dangerous'
  }

  const handleClaim = () => {
    onOpen()
  }

  useDualSpeedEffect(() => {
    setIsDetailsSlidedDown(!isDetailsOpen);
  }, [isDetailsOpen], !isDetailsOpen, 500, 0)

  return (
    <>
      {
        (isDetailsOpen || (!isDetailsOpen && !isDetailsSlidedDown)) && <PositionSlideWrapper isOpen={isDetailsOpen} onClose={() => onDetailsClose()} />
      }
      <Container
        noPadding
        contentProps={{
          cursor: 'pointer',
          onClick: () => isDetailsOpen ? onDetailsClose() : onDetailsOpen(),
        }}
        label={
          <Flex visibility={!account ? 'hidden' : 'visible'} pb={{ base: '0px', sm: '4px' }} textAlign="left" flexDirection={{ base: 'column', sm: 'row' }}>
            <Text mr="2">Banking</Text>
            {
              totalInterestsUsd?.total !== 0 && totalInterestsUsd?.total !== undefined ?
                <AnchorInterests {...totalInterestsUsd} />
                : null
            }
          </Flex>
        }
        right={
          <Stack visibility={!account ? 'hidden' : 'visible'} direction={{ base: 'column-reverse', sm: 'row' }} align="center" textAlign="end">
            <Flex flexDirection="row" alignItems="center">
              <Text color="secondary" fontSize="14" mr="2" fontWeight="bold">
                {`${rewardAmount?.toFixed(4)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards`}
              </Text>
              <AnimatedInfoTooltip
                iconProps={{ boxSize: 3, mt: '2px' }}
                message={
                  <>
                    This represents the total amount of your accrued {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards across all incentivized pools. To earn rewards, deposit assets to a market that shows a positive <b>Reward APR</b>.
                  </>
                } />
            </Flex>
            <StyledButton
              isDisabled={!rewardAmount}
              onClick={handleClaim}
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
              <Text>{`${borrowLimitPercent}%`}</Text>
            </Stack>
            <Flex w="full" h={1} borderRadius={8} bgColor="purple.850">
              <Flex w={`${borrowLimitPercent}%`} h="full" borderRadius={8} bgColor="purple.400"></Flex>
            </Flex>
            <Stack direction="row" align="center">
              <Text>{`$${borrowTotal ? commify((borrowTotal).toFixed(2)) : '0.00'}`}</Text>
              {borrowLimitPercent > 0 && borrowTotal > 0 && !!health && (
                <>
                  <Badge variant="subtle" colorScheme={badgeColorScheme}>
                    {health}
                  </Badge>
                  <AnimatedInfoTooltip
                    message={
                      <>
                        This badge indicates your current loan health.
                        <Text mt="1"><b>Dangerous</b> means your current debt is too close to your borrow limit. In this case, you should <b>repay some loans or add more collateral</b> to reduce your liquidation risk.</Text>
                        <Text mt="1"><b>Shortfall</b> means your debt is higher than what you are allowed to borrow and can be liquidated anytime.</Text>
                      </>
                    }
                  />
                </>
              )}
            </Stack>
          </Stack>
        </Flex>
        <AnchorClaimModal rewardAmount={rewardAmount} isOpen={isOpen} onClose={onClose} />
      </Container>
    </>
  )
}
