import { Flex, Stack, Text } from '@chakra-ui/react'
import Container from '@inverse/components/Container'
import { useStabilizerBalance } from '@inverse/hooks/useBalances'
import { commify } from 'ethers/lib/utils'

type StabilizerOverviewFieldProps = {
  label: string
  children: React.ReactNode
}

const StabilizerOverviewField = ({ label, children }: StabilizerOverviewFieldProps) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="semibold" color="purple.200">
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
            The Stabilizer can be used by market participants as a source of liquidity to arbitrage away
            price differentials if DOLA moves away from a 1:1 peg against USD.
          </Text>
        </Stack>
        <Stack>
          <StabilizerOverviewField label="Dai Liquidity">{`$${commify((balance || 0).toFixed(2))}`}</StabilizerOverviewField>
          <StabilizerOverviewField label="Fee">0.4%</StabilizerOverviewField>
          <StabilizerOverviewField label="Rate">1 DOLA = 1 DAI</StabilizerOverviewField>
        </Stack>
      </Stack>
    </Container>
  )
}
