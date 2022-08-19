import { Flex, Stack, Text, VStack, HStack } from '@chakra-ui/react'
import Container from '@app/components/common/Container'

import { shortenNumber } from '@app/util/markets';

import { useAccountDBRMarket, useDBRMarkets } from '@app/hooks/useDBR'
import { preciseCommify } from '@app/util/misc';
import { F2Market } from '@app/types';
import { useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';

export const CreditLimitBar = ({
  market,
  account,
  newCollateralAmount,
}: {
  market: F2Market
  account: string
  newCollateralAmount: number
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const { creditLimit, deposits, withdrawalLimit, debt } = useAccountDBRMarket(market, account);
  const { markets } = useDBRMarkets([market.address]);

  const f2market = markets[0];

  let badgeColorScheme = 'error'
  const hasDebt = deposits && withdrawalLimit && deposits > 0 && deposits !== withdrawalLimit;
  const perc = Math.max(hasDebt ? withdrawalLimit / deposits * 100 : deposits ? 100 : 0, 0);
  const newCreditLimit = (deposits + (newCollateralAmount || 0)) * f2market.collateralFactor / 100 * f2market.price;
  const newDebt = debt;
  const previewPerc = !newCollateralAmount ?
    perc : Math.max(newDebt > 0 && newCreditLimit > 0 ?
      ((newCreditLimit - debt) / newCreditLimit) * 100
      : 0, 0);
  
  const isPreviewing = previewPerc !== perc;

  const creditLeft = withdrawalLimit * f2market?.price * f2market.collateralFactor / 100;
  const newCreditLeft = newCreditLimit - newDebt;

  useDebouncedEffect(() => {
    setIsChanging(true);
    setTimeout(() => {
      setIsChanging(false);
    }, 400)
  }, [newCollateralAmount], 200);

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Collateral Health</Text>
        <Text color="secondaryTextColor">
          {
            hasDebt || deposits ? `${shortenNumber(perc, 2)}%${isPreviewing ? ` => ${shortenNumber(previewPerc, 2)}%`: ''}` : ``
          }
        </Text>
      </HStack>
      <Container
        noPadding
        p="0"
        contentBgColor={ previewPerc > 0 ? `gradient2` : 'errorAlpha' }
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
            <Flex
              position="relative"
              boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
              transition="box-shadow 0.2s ease-in-out"
              w="full"
              h={'4px'}
              alignItems="center"
              borderRadius={8}
              bgColor={`${badgeColorScheme}Alpha`}
            >
              <Flex
                transition="box-shadow 0.2s ease-in-out"
                boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
                w={`${perc}%`}
                h="6px"
                borderLeftRadius={8}
                borderRightRadius={newCollateralAmount ? '0' : 8}
                bgColor={badgeColorScheme}></Flex>
              {
                !!newCollateralAmount && <Flex
                  position="absolute"
                  zIndex="2"
                  transition="box-shadow, width 0.2s ease-in-out"
                  boxShadow={isChanging ? '0px 0px 5px 0px red' : undefined}
                  left={previewPerc > perc ? `${perc}%` : `${previewPerc}%`}
                  w={previewPerc > perc ? `${previewPerc - perc}%` : `${perc - previewPerc}%`}
                  h="6px"
                  borderLeftRadius={perc > previewPerc ? 8 : 0}
                  borderRightRadius={previewPerc > perc ? 8 : 0}
                  bgColor={'#ffffff66'}></Flex>
              }
            </Flex>
          </Stack>
        </Flex>
      </Container>
      <HStack pt="4" w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">
          {
            creditLeft ?
              `${preciseCommify(creditLeft, 2, true)}${isPreviewing ? ` => ${preciseCommify(newCreditLeft, 2, true)}` : ''}` :
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
