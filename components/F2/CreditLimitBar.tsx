import { Flex, Stack, Text, Badge, VStack, HStack } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { commify } from 'ethers/lib/utils'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { shortenNumber } from '@app/util/markets';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import moment from 'moment';

import { useAccountDBR, useAccountDBRMarket, useDBRMarkets } from '@app/hooks/useDBR'
import { preciseCommify, toFixed } from '@app/util/misc';
import { F2Market } from '@app/types';

export const CreditLimitBar = ({
  market,
  account,
}: {
  market: F2Market
  account: string
}) => {
  const { creditLimit, deposits, withdrawalLimit } = useAccountDBRMarket(market, account);
  const { markets } = useDBRMarkets([market.address]);

  const f2market = markets[0];

  let badgeColorScheme = 'error'
  const hasDebt = deposits && withdrawalLimit && deposits > 0 && deposits !== withdrawalLimit;
  const perc = Math.max(hasDebt ? withdrawalLimit / deposits * 100 : deposits ? 100 : 0, 0);
  const creditLeft = withdrawalLimit * f2market?.price * f2market.collateralFactor / 100;

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Collateral Health</Text>
        <Text color="secondaryTextColor">
          {
            hasDebt || deposits ? `${shortenNumber(perc, 2)}%` : ``
          }
        </Text>
      </HStack>
      <Container
        noPadding
        p="0"
        contentBgColor="gradient2"
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
            {/* <Stack direction="row" align="center">
              <Flex whiteSpace="nowrap" color="primary.300" fontSize="sm">
                Credit Limit Health
              </Flex>
              <AnimatedInfoTooltip message="This shows your Credit Limit balance health, your Credit Limit balance decreases over time depending on your debt, if the bar is at 100% it means your Credit Limits are depleted." />
              <Text>{`${shortenNumber(perc, 2)}%`}</Text>
            </Stack> */}
            <Flex w="full" h={1} borderRadius={8} bgColor={`${badgeColorScheme}Alpha`}>
              <Flex w={`${perc}%`} h="full" borderRadius={8} bgColor={badgeColorScheme}></Flex>
            </Flex>
            {/* <Stack direction="row" align="center">
              <Text>{`$${creditLimit ? commify((creditLimit).toFixed(2)) : '0.00'}`}</Text>
              {hasDebt && (
                <>
                  <Badge variant="subtle" colorScheme={badgeColorScheme}>
                    {health}
                  </Badge>
                  <AnimatedInfoTooltip
                    message={
                      <>
                        This badge indicates your current Credit Limit health.                                                
                      </>
                    }
                  />
                </>
              )}
            </Stack> */}
          </Stack>
        </Flex>
      </Container>
      <HStack pt="4" w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">
          {
            creditLeft ?
              `${preciseCommify(creditLeft, 2, true)} Health Left` :
              `Deposit to Gain Health`
          }
        </Text>
        <Text color="secondaryTextColor">
          {
            creditLimit ?
              `Total: ${preciseCommify(creditLimit, 2, true)}`
              :
              `No Collateral deposited`
          }
        </Text>
      </HStack>
    </VStack>
  )
}
