import { Flex, Stack, Text, Badge } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { ClaimButton } from '@inverse/components/Button'
import Container from '@inverse/components/Container'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useAnchorRewards } from '@inverse/hooks/useAnchorRewards'
import { getComptrollerContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { commify, formatUnits } from 'ethers/lib/utils'
import { InfoTooltip } from '@inverse/components/Tooltip'

export const AnchorOverview = () => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { usdBorrow, usdBorrowable } = useAccountLiquidity()
  const { rewards } = useAnchorRewards()

  const rewardAmount = rewards ? parseFloat(formatUnits(rewards)) : 0
  const borrowLimitPercent = Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100);
  let badgeColorScheme;
  let health;
  if(borrowLimitPercent <= 25) {
    badgeColorScheme = "green"
    health = "Healthy"
  } else if(borrowLimitPercent <= 75) {
    badgeColorScheme = "blue"
    health = "Moderate"
  } else {
    badgeColorScheme = "red"
    health = "Dangerous"
  }
  return (
    <Container
      label="Anchor Banking"
      right={
        <Stack direction="row" align="center" textAlign="end">
          <Text fontWeight="bold">{`${rewardAmount.toFixed(4)} INV`}</Text>
          <InfoTooltip message="This represents the total amount of your accrued INV rewards across all incentivized pools. To earn rewards, deposit assets to a market that shows a positive Reward APY."/>
          <ClaimButton
            isDisabled={!rewardAmount}
            onClick={() => getComptrollerContract(library?.getSigner()).claimComp(account)}
          >
            Claim
          </ClaimButton>
        </Stack>
      }
    >
      <Flex w="full" justify="center">
        <Stack w="full" direction="row" justify="center" align="center" spacing={2} fontSize="sm" fontWeight="semibold">
          <Flex whiteSpace="nowrap" color="purple.100" fontSize="13px">
            Borrow Limit
          </Flex>
          <InfoTooltip message="Your borrow limit represents the maximum amount that you're allowed to borrow across all tokens. If you reach 100% of your borrow limit, you will get liquidated."/>
          <Text>{`${usdBorrowable ? borrowLimitPercent : 0}%`}</Text>
          <Flex w="full" h={1} borderRadius={8} bgColor="purple.900">
            <Flex
              w={`${borrowLimitPercent}%`}
              h="full"
              borderRadius={8}
              bgColor="purple.400"
            ></Flex>
          </Flex>
          <Text>{`$${usdBorrowable ? commify((usdBorrowable + usdBorrow).toFixed(2)) : '0.00'}`}</Text>
          {borrowLimitPercent > 0 &&
            <>
              <Badge variant="outline" colorScheme={badgeColorScheme}>{health}</Badge>
              <InfoTooltip message="This badge indicates your current loan health. If your loan health shows as 'Dangerous' then your current debt is too close to your borrow limit. In this case, you should repay some loans or add more collateral to reduce your liquidation risk."/>
            </>
          }
        </Stack>
      </Flex>
    </Container>
  )
}
