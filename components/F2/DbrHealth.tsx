import { Flex, Stack, Text, Badge, VStack, HStack } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { commify } from 'ethers/lib/utils'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { shortenNumber } from '@app/util/markets';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import moment from 'moment';

import { useAccountDBR } from '@app/hooks/useDBR'
import { preciseCommify } from '@app/util/misc';

export const DbrHealth = () => {
  const { account } = useWeb3React<Web3Provider>()

  const dbrPrice = 2.1;
  const { balance, dbrNbDaysExpiry, signedBalance, dailyDebtAccrual, dbrDepletionPerc, dbrExpiryDate } = useAccountDBR(account);

  const borrowTotal = 0;

  let badgeColorScheme = 'success'
  let health
  const hasDebt = dailyDebtAccrual !== 0;

  // if(!hasDebt) {
  //   return <></>
  // }

  // if (!hasDebt) {
  //   badgeColorScheme = 'gray'
  //   health = 'NO COLLATERAL'
  // } else if (dbrNbDaysExpiry >= 180) {
  //   badgeColorScheme = 'green'
  //   health = 'Healthy'
  // } else if (dbrNbDaysExpiry >= 90) {
  //   badgeColorScheme = 'yellow'
  //   health = 'Moderate'
  // } else if (dbrNbDaysExpiry >= 30) {
  //   badgeColorScheme = 'orange'
  //   health = 'Low Health'
  // } else if (dbrNbDaysExpiry >= 7) {
  //   badgeColorScheme = 'red'
  //   health = 'Very Low Health'
  // } else if (dbrNbDaysExpiry >= 0) {
  //   badgeColorScheme = 'red'
  //   health = 'Depleted Soon!'
  // } else if (signedBalance <= 0) {
  //   badgeColorScheme = 'red'
  //   health = 'Depleted!'
  // }

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Borrowing Stamina</Text>
        {!!dailyDebtAccrual &&
          <Text color="secondaryTextColor">
            -{shortenNumber(dailyDebtAccrual)} DBR a day
          </Text>
        }
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
                DBR Health
              </Flex>
              <AnimatedInfoTooltip message="This shows your DBR balance health, your DBR balance decreases over time depending on your debt, if the bar is at 100% it means your DBRs are depleted." />
              <Text>{`${dbrDepletionPerc}%`}</Text>
            </Stack> */}
            <Flex w="full" h={1} borderRadius={8} bgColor={`${badgeColorScheme}Alpha`}>
              <Flex w={`${dbrDepletionPerc}%`} h="full" borderRadius={8} bgColor={badgeColorScheme}></Flex>
            </Flex>
            {/* <Stack direction="row" align="center">
              <Text>{`$${borrowTotal ? commify((borrowTotal).toFixed(2)) : '0.00'}`}</Text>
              {hasDebt && (
                <>
                  <Badge variant="subtle" colorScheme={badgeColorScheme}>
                    {health}
                  </Badge>
                  <AnimatedInfoTooltip
                    message={
                      <>
                        This badge indicates your current DBR health.                                                
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
            !!dbrNbDaysExpiry ?
              `${preciseCommify(dbrNbDaysExpiry, 0)} days left`
              :
              hasDebt ?
                'Exhausted! Collateral Health may get damaged'
                :
                'Having a Borrowing period requires DBR tokens'
          }
        </Text>
        <Text color="secondaryTextColor">
          {
            signedBalance === 0 && !hasDebt ?
              'No DBR tokens'
              :
              `DBR tokens: ${preciseCommify(signedBalance, 2)}`
          }
        </Text>
      </HStack>
    </VStack>
  )
}
