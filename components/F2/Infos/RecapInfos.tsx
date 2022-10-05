import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { getDBRRiskColor, getDepletionDate } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { VStack, Text } from "@chakra-ui/react"
import moment from 'moment'
import { useEffect, useState } from "react"

export const RecapInfos = ({
    market,
    dbrCover,
    newLiquidationPrice,
    durationTypedValue,
    durationType,
    dbrPrice,
    riskColor,
    newPerc,
    dbrCoverDebt,
    collateralAmount,
    debtAmount,
    duration,
    isAutoDBR = true,
    isTuto = true,
    isDeposit = true,
    newDBRExpiryDate,
    ...props
}) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        let interval = setInterval(() => {
            setNow(Date.now());
        });
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, []);

    const collateralWording = isDeposit ? 'deposit' : 'withdraw';
    const debtWording = isDeposit ? 'borrow' : 'repay';
    const dbrRiskColor = getDBRRiskColor(newDBRExpiryDate, now);

    return <VStack w='full' alignItems="flex-start" spacing="2" {...props}>
        {
            isTuto && <>
                <Text fontSize="20px" fontWeight="extrabold">Recap:</Text>
                <TextInfo message="The duration value is only to calculate the amount of DBR needed">
                    <Text>You can terminate the loan at any time</Text>
                </TextInfo>
            </>
        }
        {
            !!collateralAmount && <TextInfo message="The more you deposit the more you can borrow">
                <Text>You will {collateralWording} <b>{shortenNumber(collateralAmount, 2)} {market.underlying.symbol} ({shortenNumber(collateralAmount * market.price, 2, true)})</b></Text>
            </TextInfo>
        }
        {
            isAutoDBR && <TextInfo message="Loan Annual Percentage Rate and duration of the Fixed-Rate">
                <Text>You will lock-In a Fixed-Rate of <b>{shortenNumber(dbrPrice * 100, 2)}% APR</b> for <b>{durationTypedValue} {durationTypedValue > 1 ? durationType : durationType.replace(/s$/, '')}{durationType !== 'days' ? ` (${duration} days)` : ''}</b></Text>
            </TextInfo>
        }
        {
            !!debtAmount && <TextInfo message="The amount of DOLA you will receive">
                <Text>You will {debtWording} <b>{shortenNumber(debtAmount, 2)} DOLA</b></Text>
            </TextInfo>
        }
        {
            isAutoDBR && <TextInfo message="DBRs will be burned over time as fees to cover the loan, they should stay in your wallet while the loan is active">
                <Text>You will purchase <b>{shortenNumber(dbrCover, 2)} DBRs ({shortenNumber(dbrCoverDebt, 2, true)})</b> to cover the loan duration</Text>
            </TextInfo>
        }
        {
            isAutoDBR && <TextInfo message="The debt to repay for this loan, total debt can increase if you exceed the chosen loan duration or run out of DBRs">
                <Text>Your debt for this loan will be <b>{shortenNumber(debtAmount + (isAutoDBR ? dbrCoverDebt : 0), 2)} DOLA</b></Text>
            </TextInfo>
        }
        {
            newPerc !== 100 && !isTuto && <>
                <TextInfo color={dbrRiskColor} message="Moment at which you will run out of DBR tokens to cover the loan duration, please top-up your DBR before it, otherwise your debt will increase">
                    <Text fontWeight="bold" color={dbrRiskColor}>
                        The DBR depletion date will be <b style={{ fontWeight: '1000' }}>{getDepletionDate(newDBRExpiryDate, now)}</b>
                    </Text>
                </TextInfo>
                <TextInfo color={riskColor} message="If the collateral price reaches that price, your collateral can be liquidated entirely">
                    <Text fontWeight="bold" color={riskColor}>The Collateral Health will be <b style={{ fontWeight: '1000' }}>{shortenNumber(newPerc, 2)}%</b></Text>
                </TextInfo>
                <TextInfo color={riskColor} message="If the collateral price reaches that price, your collateral can be liquidated entirely">
                    <Text fontWeight="bold" color={riskColor}>Your liquidation price will be <b style={{ fontWeight: '1000' }}>{preciseCommify(newLiquidationPrice, 0, true)} (current price is {preciseCommify(market.price, 0, true)})</b></Text>
                </TextInfo>
            </>
        }
    </VStack>
}