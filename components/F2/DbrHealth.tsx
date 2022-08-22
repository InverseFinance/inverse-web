import { Text, VStack, HStack } from '@chakra-ui/react'

import { useAccountDBR } from '@app/hooks/useDBR'
import { preciseCommify } from '@app/util/misc';
import { F2Market } from '@app/types';
import { F2StateInfo } from './F2StateInfo';
import { QuantityBar } from './QuantityBar';

export const DbrHealth = ({
  market,
  account,
  debtDelta,
}: {
  market: F2Market
  account: string
  debtDelta: number
}) => {
  const { dbrNbDaysExpiry, signedBalance, dailyDebtAccrual, dbrDepletionPerc, dbrExpiryDate, balance, debt } = useAccountDBR(account);
  const { dailyDebtAccrual: newDailyRate, dbrExpiryDate: previewExpiryDate, dbrDepletionPerc: previewPerc } = useAccountDBR(account, debt + debtDelta);

  const hasDebt = dailyDebtAccrual !== 0;

  const isPreviewing = !!debtDelta;

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Borrowing Stamina</Text>
        <F2StateInfo
          currentValue={-dailyDebtAccrual}
          nextValue={isPreviewing ? -newDailyRate : undefined}
          placeholder={`${preciseCommify(balance, 2)} DOLA / Year`}
          suffix=" DBR a day"
          type="number"
        />
      </HStack>
      <QuantityBar
        perc={dbrDepletionPerc}
        previewPerc={previewPerc}
        // hasError={!!hasDebt && !!isPreviewing && previewPerc <= 0 }
        badgeColorScheme={'success'}
        isPreviewing={isPreviewing}
      />
      <HStack pt="4" w='full' justifyContent="space-between">
        {/* <Text color="secondaryTextColor">
          {
            dbrNbDaysExpiry > 0 ?
              `${moment(dbrExpiryDate).fromNow(true)} before Exhaust`
              :
              hasDebt ?
                'Exhausted! Collateral Health may get damaged'
                :
                signedBalance === 0 ?
                  'Get DBR tokens to hold loans over time'
                  :
                  'No on-going Loans'
          }
        </Text> */}
        <F2StateInfo
          currentValue={dbrExpiryDate}
          nextValue={isPreviewing ? previewExpiryDate : undefined}
          type={'remainingTime'}
          placeholder={ hasDebt && dbrNbDaysExpiry <=0 ? 'Exhausted!' : 'No on-going Loans' }
          suffix={ (isPreviewing && previewExpiryDate !== null) || (!isPreviewing && hasDebt)  ? ' before Exhaust' : undefined }
        />
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
