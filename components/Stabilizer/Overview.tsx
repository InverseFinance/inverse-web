import { Flex, Stack, Text } from '@chakra-ui/react'
import { useStabilizerBalance } from '@app/hooks/useBalances'
import { InfoMessage } from '@app/components/common/Messages';
import { dollarify } from '@app/util/markets';
import ScannerLink from '../common/ScannerLink';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { useStabilizerFees } from '@app/hooks/usePrices';

const { STABILIZER } = getNetworkConfigConstants(NetworkIds.mainnet);

type StabilizerOverviewFieldProps = {
  label: string
  children: React.ReactNode
}

const StabilizerOverviewField = ({ label, children }: StabilizerOverviewFieldProps) => (
  <Flex justify="space-between">
    <Text fontWeight="bold">
      {label}:
    </Text>
    <Flex fontWeight="bold">
      {children}
    </Flex>
  </Flex>
)

export const StabilizerOverview = () => {
  const { balance } = useStabilizerBalance()
  const { buyFee, sellFee } = useStabilizerFees();

  return (
    <InfoMessage
      alertProps={{
        fontSize: '12px',
      }}
      description={
        <Stack spacing={4}>
          <Stack>
            <Text fontSize="14px" fontWeight="bold">What is the Stabilizer?</Text>
            <Text>
              The Stabilizer can be used by market participants as a source of liquidity for the <b>DAI-DOLA pair</b> to arbitrage away price
              differentials if DOLA moves away from a 1:1 peg against USD.
            </Text>
            <Text fontWeight="bold">
              There is no slippage when using the Stabilizer
            </Text>
          </Stack>
          <Stack>
            <StabilizerOverviewField label="DOLA Buy Fee">
              {buyFee * 100}% (1 DAI => {1-buyFee} DOLA)
            </StabilizerOverviewField>
            <StabilizerOverviewField label="DOLA Sell Fee">
              {sellFee * 100}% (1 DOLA => {1-sellFee} DAI)
            </StabilizerOverviewField>
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
