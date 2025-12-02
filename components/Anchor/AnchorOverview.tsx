import { Flex, Stack, Text, Badge, useDisclosure, VStack, Box } from '@chakra-ui/react'
import { OutlineButton, StyledButton, SubmitButton } from '@app/components/common/Button'
import Container from '@app/components/common/Container'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useAnchorRewards } from '@app/hooks/useAnchorRewards'
import { commify, formatUnits } from 'ethers/lib/utils'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { TEST_IDS } from '@app/config/test-ids'
import { useBorrowBalances, useSuppliedBalances, useSupplyBalances } from '@app/hooks/useBalances';
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { useAccountMarkets, useMarkets } from '@app/hooks/useMarkets'
import { Interests } from '@app/types'
import { getTotalInterests } from '@app/util/markets';
import { AnchorInterests } from './AnchorInterests'
import { usePrices } from '@app/hooks/usePrices'
import { AnchorClaimModal } from './AnchorClaimModal'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { PositionSlideWrapper } from '@app/components/Positions/PositionSlideWrapper'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { useState } from 'react'
import { InfoMessage, WarningMessage } from '../common/Messages'
import Link from '@app/components/common/Link'

export const AnchorOverview = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { usdBorrow, usdBorrowable, usdShortfall } = useAccountLiquidity()
  const { markets: accountMarkets } = useAccountMarkets()
  const { rewards } = useAnchorRewards()
  const { balances: supplyBalances } = useSupplyBalances()
  const suppliedBalances = useSuppliedBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { markets } = useMarkets()
  const { exchangeRates } = useExchangeRatesV2()
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
  const pausedCollaterals = accountMarkets.filter(m => m.collateralGuardianPaused);
  const hasStuckTokens = !!suppliedBalances.find(m => m.underlying.symbol.endsWith('-v1') && m.supplied > 0);

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

  if (!account
    || (
      !!account
      && borrowLimitPercent === 0
      && rewardAmount === 0
      && pausedCollaterals?.length === 0
      && totalInterestsUsd?.total === 0
    )) {
    return <></>
  }

  return (
    <VStack w='full'>
      {
        (isDetailsOpen || (!isDetailsOpen && !isDetailsSlidedDown)) && <PositionSlideWrapper isOpen={isDetailsOpen} onClose={() => onDetailsClose()} />
      }
      <Container
        noPadding
        // contentBgColor="gradient2"
        contentProps={{
          cursor: 'pointer',
          onClick: () => isDetailsOpen ? onDetailsClose() : onDetailsOpen(),
          transition: 'background-color 500ms',
          _hover: { bg: 'gradient1' },
        }}
        label={
          <Flex visibility={!account ? 'hidden' : 'visible'} pb={{ base: '0px', sm: '4px' }} textAlign="left" flexDirection={{ base: 'column', sm: 'row' }}>
            <Text mr="2">Banking</Text>
            {
              totalInterestsUsd?.total !== 0 && totalInterestsUsd?.total !== undefined ?
                <AnchorInterests interests={totalInterestsUsd} />
                : null
            }
          </Flex>
        }
        right={
          <Stack visibility={!account ? 'hidden' : 'visible'} direction={{ base: 'column-reverse', sm: 'row' }} align="center" textAlign="end">
            <Flex flexDirection="row" alignItems="center">
              <Text color="accentTextColor" fontSize="14" mr="2" fontWeight="bold">
                {`${rewardAmount?.toFixed(4)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards`}
              </Text>
              <AnimatedInfoTooltip
                iconProps={{ boxSize: 3, mt: '2px', color: 'accentTextColor' }}
                message={
                  <>
                    This represents the total amount of your accrued {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards across all incentivized pools. To earn rewards, deposit assets to a market that shows a positive <b>Reward APR</b>.
                  </>
                } />
            </Flex>
            <SubmitButton
              w='fit-content'
              maxH={{ base: '30px', sm: 'auto' }}
              isDisabled={!rewardAmount}
              onClick={handleClaim}
              data-testid={TEST_IDS.anchor.claim}
            >
              Claim
            </SubmitButton>
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
              <Flex whiteSpace="nowrap" color="secondaryTextColor" fontSize="sm">
                Borrow Limit
              </Flex>
              <AnimatedInfoTooltip message="Your borrow limit represents the maximum amount that you're allowed to borrow across all tokens. If you reach 100% of your borrow limit, you will get liquidated." />
              <Text>{`${borrowLimitPercent}%`}</Text>
            </Stack>
            <Flex w="full" h={1} borderRadius={8} bgColor="barUnfilledColor">
              <Flex w={`${borrowLimitPercent}%`} h="full" borderRadius={8} bgColor="barFilledColor"></Flex>
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
      {
        pausedCollaterals?.length > 0 &&
        <Stack px="6" w='full'>
          {
            pausedCollaterals.length === 1 && pausedCollaterals[0].underlying.symbol === RTOKEN_SYMBOL ?
              <InfoMessage
                alertProps={{ w: 'full' }}
                title="Your borrowing ability is paused at the moment"
                description={
                  <>
                    <Text>Borrowing by using <b>{RTOKEN_SYMBOL}</b> as a collateral is paused for now but will be soon available again.</Text>
                  </>
                }
              />
              :
              <WarningMessage
                alertProps={{ w: 'full' }}
                title="Your borrowing ability is currently paused"
                description={
                  <>
                    Paused Collaterals that you're using: <b>{pausedCollaterals.map(m => m.underlying.symbol).join(', ')}</b>
                    <Text>To be able to borrow again, you need to deactivate the collateral option for those assets, be careful on the borrowing limit change if doing so.</Text>
                    {
                      (!!pausedCollaterals.find(m => m.underlying.symbol === RTOKEN_SYMBOL)) &&
                      <Text>Regarding using <b>{RTOKEN_SYMBOL}</b> as collateral, you can just wait as the oracle fix is coming soon.</Text>
                    }
                  </>
                }
              />
          }
          {
            hasStuckTokens && <InfoMessage
              alertProps={{ w: 'full' }}
              title="Bad Debt Repayment Contracts now Available"
              description={
                <Box display="inline-block">
                  Since <Link display="inline-block" href="https://www.inverse.finance/governance/proposals/mills/57" textDecoration="underline">Proposal Mills #57</Link> you can use the <Link textDecoration="underline" display="inline-block" href="/frontier/debt-converter">DebtConverter</Link> and <Link textDecoration="underline" display="inline-block" href="/frontier/debt-repayer">DebtRepayer</Link> to Convert or Sell your v-1 tokens that are stuck due to the bad debts.
                </Box>
              }
            />
          }
        </Stack>
      }
    </VStack>
  )
}
