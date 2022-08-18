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

  const { balance, dbrNbDaysExpiry, signedBalance, dailyDebtAccrual, dbrDepletionPerc, dbrExpiryDate } = useAccountDBR(account);

  let badgeColorScheme = 'success'
  const hasDebt = dailyDebtAccrual !== 0;

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Borrowing Stamina</Text>
        {
          signedBalance > 0 && !dailyDebtAccrual &&
          <Text color="secondaryTextColor">
            {preciseCommify(signedBalance, 0)} DOLA / Year
          </Text>
        }
        {
          !!dailyDebtAccrual &&
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
              `${preciseCommify(dbrNbDaysExpiry, 0)} days left before Exhaustion`
              :
              hasDebt ?
                'Exhausted! Collateral Health may get damaged'
                :
                signedBalance === 0 ?
                  'Get DBR tokens to hold loans over time'
                  :
                  'No on-going Loans'
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
