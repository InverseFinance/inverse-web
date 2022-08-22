import { Text, VStack, HStack } from '@chakra-ui/react'
import { useAccountDBRMarket, useDBRMarkets } from '@app/hooks/useDBR'
import { F2Market } from '@app/types';
import { F2StateInfo } from './F2StateInfo';
import { QuantityBar } from './QuantityBar';

export const CreditLimitBar = ({
  market,
  account,
  amountDelta,
  debtDelta,
}: {
  market: F2Market
  account: string
  amountDelta: number
  debtDelta: number
}) => {
  const { creditLimit, deposits, withdrawalLimit, debt } = useAccountDBRMarket(market, account);
  const { markets } = useDBRMarkets([market.address]);

  const f2market = markets[0];

  const badgeColorScheme = 'error'

  const hasDebt = deposits && withdrawalLimit && deposits > 0 && deposits !== withdrawalLimit;
  const perc = Math.max(hasDebt ? withdrawalLimit / deposits * 100 : deposits ? 100 : 0, 0);
  const newCreditLimit = (deposits + (amountDelta || 0)) * f2market.collateralFactor / 100 * f2market.price;
  const newDebt = debt + debtDelta;

  const previewPerc = !amountDelta && !debtDelta ?
    perc : Math.min(
      Math.max(
        (newCreditLimit > 0 ?
          ((newCreditLimit - newDebt) / newCreditLimit) * 100
          : 0)
        , 0)
      , 100);

  const isPreviewing = !!(amountDelta || debtDelta);

  const creditLeft = withdrawalLimit * f2market?.price * f2market.collateralFactor / 100;
  const newCreditLeft = newCreditLimit - newDebt;

  return (
    <VStack w='full' spacing="0">
      <HStack w='full' justifyContent="space-between">
        <Text color="secondaryTextColor">Collateral Health</Text>
        <Text color="secondaryTextColor">
          {
            (hasDebt || deposits) && <F2StateInfo
              currentValue={perc}
              nextValue={isPreviewing && perc !== previewPerc ? previewPerc : undefined}
              type={'perc'}
            />
          }
        </Text>
      </HStack>
      <QuantityBar
        perc={perc}
        previewPerc={previewPerc}
        hasError={!!hasDebt && !!isPreviewing && previewPerc <= 0 }
        badgeColorScheme={badgeColorScheme}
        isPreviewing={isPreviewing}
      />
      <HStack pt="4" w='full' justifyContent="space-between">
        <F2StateInfo
          currentValue={creditLeft}
          nextValue={isPreviewing ? newCreditLeft : undefined}
          type={'dollar'}
          placeholder="Deposit to Gain Health"
          suffix=" left"
        />
        <F2StateInfo
          currentValue={creditLimit}
          nextValue={isPreviewing ? newCreditLeft : undefined}
          type={'dollar'}
          placeholder="No Collateral deposited"
          prefix={creditLimit && !isPreviewing ? 'Total: ' : ''}
        />
      </HStack>
    </VStack>
  )
}
