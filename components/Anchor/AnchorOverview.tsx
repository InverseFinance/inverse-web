import { Flex, Stack, Text } from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import { commify, formatEther } from 'ethers/lib/utils'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'
import { useRewards } from '@inverse/hooks/useRewards'
import { ClaimButton } from '../Button'
import { Contract } from 'ethers'
import { COMPTROLLER } from '@inverse/config'
import { Web3Provider } from '@ethersproject/providers'
import { COMPTROLLER_ABI } from '@inverse/abis'
import { useWeb3React } from '@web3-react/core'

export const AnchorOverview = () => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { usdBorrow, usdBorrowable, netApy } = useAccountLiquidity()
  const { rewards } = useRewards()

  return usdBorrow || usdBorrowable ? (
    <Container
      w="84rem"
      label={
        <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">{`Net APY: ${netApy.toFixed(2)}%`}</Text>
          <Stack direction="row" align="center">
            <Text fontWeight="bold">{`${(rewards ? parseFloat(formatEther(rewards)) : 0).toFixed(4)} INV`}</Text>
            <ClaimButton
              onClick={() => new Contract(COMPTROLLER, COMPTROLLER_ABI, library?.getSigner()).claimComp(account)}
            >
              Claim
            </ClaimButton>
          </Stack>
        </Flex>
      }
    >
      <Flex w="full" justify="center">
        <Stack w="full" direction="row" justify="center" align="center" spacing={2} fontSize="sm" fontWeight="semibold">
          <Flex whiteSpace="nowrap" color="purple.100" fontSize="13px">
            Borrow Limit
          </Flex>
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
  ) : (
    <></>
  )
}
