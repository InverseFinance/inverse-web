import { Flex, Stack, Text } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { useStabilizerBalance } from '@app/hooks/useBalances'
import { commify } from 'ethers/lib/utils'

type StabilizerOverviewFieldProps = {
  label: string
  children: React.ReactNode
}

const StabilizerOverviewField = ({ label, children }: StabilizerOverviewFieldProps) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="semibold" color="purple.300">
      {label}
    </Text>
    <Flex fontWeight="semibold" fontSize="sm">
      {children}
    </Flex>
  </Flex>
)

export const StabilizerOverview = () => {
  const { balance } = useStabilizerBalance()

  return (
    <Container noPadding>
      <Stack spacing={4}>
        <Stack>
          <Text fontWeight="semibold">What is the Stabilizer?</Text>
          <Text fontSize="sm">
            The Stabilizer can be used by market participants as a source of liquidity for the <b>DAI-DOLA pair</b> to arbitrage away price
            differentials if DOLA moves away from a 1:1 peg against USD.
          </Text>
          <Text fontSize="sm" fontWeight="bold">
            There is no slippage when using the Stabilizer
          </Text>
        </Stack>
        <Stack>
          <StabilizerOverviewField label="Dai Liquidity">{`$${commify(
            (balance || 0).toFixed(2)
          )}`}</StabilizerOverviewField>
          <StabilizerOverviewField label="Rate">Fixed rate of 0.996 either way</StabilizerOverviewField>
        </Stack>
      </Stack>
    </Container>
  )
}
