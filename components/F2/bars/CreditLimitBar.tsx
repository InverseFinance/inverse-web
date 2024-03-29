import { VStack, HStack } from '@chakra-ui/react'
import { useAccountDBRMarket } from '@app/hooks/useDBR'
import { F2Market } from '@app/types';
import { F2StateInfo } from './F2StateInfo';
import { QuantityBar } from './QuantityBar';
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2';
import { preciseCommify } from '@app/util/misc';

export const CreditLimitBar = ({
  market,
  account,
  amountDelta,
  debtDelta,
  onModalOpen,
}: {
  market: F2Market
  account: string
  amountDelta: number
  debtDelta: number
  onModalOpen: () => void
}) => {
  const { creditLimit, deposits, debt, perc, hasDebt, creditLeft, liquidationPrice } = useAccountDBRMarket(market, account);

  const badgeColorScheme = 'error'

  const {
    newPerc, newCreditLeft, newLiquidationPrice, newDebt, newCreditLimit
  } = f2CalcNewHealth(market, deposits, debt, amountDelta, debtDelta, perc);

  const isPreviewing = !!(amountDelta || debtDelta);
  const riskColor = newDebt > 0 ? getRiskColor(newPerc) : 'secondaryTextColor';

  return (
    <VStack w='full' spacing="0" alignItems="center">
      <HStack w='full' justifyContent="space-between">
        <F2StateInfo
          currentValue={liquidationPrice}
          nextValue={isPreviewing ? newLiquidationPrice : undefined}
          type={'dollar'}
          placeholder="No Risk"
          prefix="Liquidation Price: "
          color={riskColor}
          tooltip={
            hasDebt ? `If the collateral price reaches or goes below ${preciseCommify(liquidationPrice || newLiquidationPrice || 0, 2, true)}, liquidations may happen on your collateral.`
              : ''
          }
        />
        {
          (hasDebt || deposits)
          && <F2StateInfo
            currentValue={perc}
            nextValue={isPreviewing && perc !== newPerc ? newPerc : undefined}
            type={'perc'}
            placeholder=""
            prefix="Health Level: "
            color={riskColor}
            tooltip={
              hasDebt ? "The percentage of the Loan covered by your Collateral, the higher the safer."
              : ''
            }
          />
        }
      </HStack>
      <QuantityBar
        title="Loan Health"
        perc={perc}
        previewPerc={newPerc}
        hasError={(!!hasDebt || !!isPreviewing) && newPerc <= 0}
        badgeColorScheme={badgeColorScheme}
        isPreviewing={isPreviewing}
        cursor="pointer"
        onClick={() => onModalOpen()}
      />
      <HStack pt="4" w='full' justifyContent="space-between">
        <F2StateInfo
          currentValue={creditLeft}
          nextValue={isPreviewing ? newCreditLeft : undefined}
          type={'dollar'}
          placeholder="Deposit to Gain Health"
          suffix=" Health Left"
          tooltipTitle="Health Left"
          tooltip={
            hasDebt ? "The Borrowing Power left in USD, if it reaches 0, liquidations can happen." : ''
          }
        />
        <F2StateInfo
          currentValue={creditLimit}
          nextValue={isPreviewing ? newCreditLimit : undefined}
          type={'dollar'}
          placeholder="No Collateral deposited"
          prefix={'Total: '}
          tooltipTitle="Total Borrowing Power"
          tooltip={
            hasDebt ? "The borrowing power in USD given by your deposited collaterals." : ''
          }
        />
      </HStack>
    </VStack>
  )
}
