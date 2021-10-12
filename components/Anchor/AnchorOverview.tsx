import { Flex, Stack, Text } from '@chakra-ui/react'
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
  const { usdBorrow, usdBorrowable, netApy } = useAccountLiquidity()
  const { rewards } = useAnchorRewards()

  const rewardAmount = rewards ? parseFloat(formatUnits(rewards)) : 0

  return (
    <Container
      label="Anchor Banking"
      description={`${netApy.toFixed(2)}% Net APY`}
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
          <Text>{`${usdBorrowable ? Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100) : 0}%`}</Text>
          <Flex w="full" h={1} borderRadius={8} bgColor="purple.900">
            <Flex
              w={`${Math.floor((usdBorrow / (usdBorrowable + usdBorrow)) * 100)}%`}
              h="full"
              borderRadius={8}
              bgColor="purple.400"
            ></Flex>
          </Flex>
          <Text>{`$${usdBorrowable ? commify((usdBorrowable + usdBorrow).toFixed(2)) : '0.00'}`}</Text>
        </Stack>
      </Flex>
    </Container>
  )
}
