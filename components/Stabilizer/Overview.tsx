import { Flex, Stack, Text } from '@chakra-ui/react'
import { useStabilizerBalance } from '@app/hooks/useBalances'
import { InfoMessage } from '@app/components/common/Messages';
import { dollarify } from '@app/util/markets';
import ScannerLink from '../common/ScannerLink';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';

const { STABILIZER } = getNetworkConfigConstants(NetworkIds.mainnet);

type StabilizerOverviewFieldProps = {
  label: string
  children: React.ReactNode
}

const StabilizerOverviewField = ({ label, children }: StabilizerOverviewFieldProps) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="semibold">
      {label}:
    </Text>
    <Flex fontWeight="semibold" fontSize="sm">
      {children}
    </Flex>
  </Flex>
)

export const StabilizerOverview = () => {
  const { balance } = useStabilizerBalance()

  return (
    <InfoMessage
      description={
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
            <StabilizerOverviewField label="Swap Fee">0.4%</StabilizerOverviewField>
            <StabilizerOverviewField label="Rate">Fixed rate of 0.996 either way</StabilizerOverviewField>
            <StabilizerOverviewField label="Dai Liquidity">
              {dollarify(balance || 0, 2)}
            </StabilizerOverviewField>
            <StabilizerOverviewField label="Contract">
              <ScannerLink value={STABILIZER} />
            </StabilizerOverviewField>
          </Stack>
        </Stack>
      }
    />
  )
}
