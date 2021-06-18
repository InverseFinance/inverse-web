import { Flex, Stack, Text } from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import { commify } from 'ethers/lib/utils'
import { useAccountLiquidity } from '@inverse/hooks/useAccountLiquidity'

export const AnchorOverview = () => {
  const { usdBorrow, usdBorrowable, netApy } = useAccountLiquidity()

  return usdBorrow || usdBorrowable ? (
    <Container w="84rem" label={`Net APY: ${netApy.toFixed(2)}%`}>
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
