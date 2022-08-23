import { Text, VStack, HStack } from '@chakra-ui/react'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { F2Market } from '@app/types';
import { F2StateInfo } from './F2StateInfo';
import { QuantityBar } from './QuantityBar';
import { f2CalcNewHealth } from '@app/util/f2';
import { preciseCommify } from '@app/util/misc';

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
  const { creditLimit, deposits, debt, perc, hasDebt, creditLeft, liquidationPrice } = useAccountDBRMarket(market, account);

  const badgeColorScheme = 'error'

  const {
    newPerc, newCreditLeft, newLiquidationPrice
  } = f2CalcNewHealth(market, deposits, debt, amountDelta, debtDelta, perc);

  const isPreviewing = !!(amountDelta || debtDelta);
  console.log(liquidationPrice)
  console.log(newLiquidationPrice)

  return (
    <VStack w='full' spacing="0" alignItems="center">
      <HStack w='full' justifyContent="space-between">
        <F2StateInfo
          currentValue={liquidationPrice}
          nextValue={isPreviewing ? newLiquidationPrice : undefined}
          type={'dollar'}
          placeholder="No Risk"
          prefix="Liquidation Price: "
          tooltip={`If the collateral price reaches or goes below ${preciseCommify(liquidationPrice||newLiquidationPrice||0, 2, true)}, liquidations may happen on your collateral.`}
        />
        <Text color="secondaryTextColor">
          {
            (hasDebt || deposits)
            && <F2StateInfo
              currentValue={perc}
              nextValue={isPreviewing && perc !== newPerc ? newPerc : undefined}
              type={'perc'}
              prefix="Health Level: "
              tooltip="The percentage of the Loan covered by your Collateral, the higher the safer."
            />
          }
        </Text>
      </HStack>
      <QuantityBar
        title="Collateral Health"
        perc={perc}
        previewPerc={newPerc}
        hasError={!!hasDebt && !!isPreviewing && newPerc <= 0}
        badgeColorScheme={badgeColorScheme}
        isPreviewing={isPreviewing}
      />
      <HStack pt="4" w='full' justifyContent="space-between">
        <F2StateInfo
          currentValue={creditLeft}
          nextValue={isPreviewing ? newCreditLeft : undefined}
          type={'dollar'}
          placeholder="Deposit to Gain Health"
          suffix=" Health Left"
          tooltip="The Borrowing Power left in USD, if it reaches 0, liquidations can happen."
        />
        <F2StateInfo
          currentValue={creditLimit}
          nextValue={isPreviewing ? newCreditLeft : undefined}
          type={'dollar'}
          placeholder="No Collateral deposited"
          tooltip="The borrowing power in USD given by your deposited collaterals."
          prefix={'Borrowing Power: '}
        />
      </HStack>
    </VStack>
  )
}
