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
    collateralAmountNum,
    collateralAmount,
    debtAmount,
    debtAmountNum,
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
    const fontSize = isTuto ? { base: '12px', sm: '14px', md: '20px' } : { base: '12px', sm: '14px' };
    const hasHelper = !!market?.helper;
    const worth = collateralAmountNum * market.price * market.collateralFactor;

    return <VStack w='full' alignItems="flex-start" spacing="2" {...props}>
        {/* {
            isTuto && <>                
                <TextInfo message="The duration value is only to calculate the amount of DBR needed">
                    <Text fontSize={fontSize}>You can terminate the loan at any time</Text>
                </TextInfo>
            </>
        } */}
        {
            !!collateralAmountNum && <TextInfo message="The more you deposit the more you can borrow">
                <Text fontSize={fontSize}>You will {collateralWording} <b>{shortenNumber(collateralAmountNum, 2)} {market.underlying.symbol} ({shortenNumber(collateralAmountNum * market.price, 2, true)})</b></Text>
            </TextInfo>
        }
        <TextInfo message="The debt to repay for this loan, total debt can increase if you exceed the chosen loan duration or run out of DBRs">
            <Text fontSize={fontSize}>With the collateral factor of {shortenNumber(market.collateralFactor*100, 0)}% your deposit is worth {shortenNumber(worth, 2, true)}</Text>
        </TextInfo>
        {
            !!debtAmountNum && <TextInfo message="The amount of DOLA you will receive">
                <Text fontSize={fontSize}>You will {debtWording} <b>{shortenNumber(debtAmountNum, 2)} DOLA</b></Text>
            </TextInfo>
        }
        {
            isAutoDBR && isTuto && hasHelper && <TextInfo message="Loan Annual Percentage Rate and duration of the Fixed-Rate">
                <Text fontSize={fontSize}>You will lock-In a <b>{shortenNumber(dbrPrice * 100, 2)}% APR</b> for <b>{durationTypedValue} {durationTypedValue > 1 ? durationType : durationType.replace(/s$/, '')}{durationType !== 'days' ? ` (${duration} days)` : ''}</b></Text>
            </TextInfo>
        }
        {
            isAutoDBR && hasHelper && <TextInfo message="DBRs will be spent over time as fees to cover the loan, they should stay in your wallet while the loan is active">
                <Text fontSize={fontSize}>You will purchase <b>{shortenNumber(dbrCover, 2)} DBRs ({shortenNumber(dbrCoverDebt, 2, true)})</b> to cover the loan duration</Text>
            </TextInfo>
        }
        {
            isAutoDBR && hasHelper && <TextInfo message="The debt to repay for this loan, total debt can increase if you exceed the chosen loan duration or run out of DBRs">
                <Text fontSize={fontSize}>Your total loan amount including DBR will be <b>{shortenNumber(debtAmountNum + (isAutoDBR ? dbrCoverDebt : 0), 2)} DOLA</b></Text>
            </TextInfo>
        }
        {
            newPerc !== 100 && <>
                {
                    <TextInfo color={dbrRiskColor} message="Moment at which you will run out of DBR tokens to cover the loan duration, please top-up your DBR before it, otherwise your debt will increase">
                        <Text fontSize={fontSize} fontWeight="bold" color={dbrRiskColor}>
                            The DBR depletion date will be <b style={{ fontWeight: '1000' }}>{getDepletionDate(newDBRExpiryDate, now)}</b>
                        </Text>
                    </TextInfo>
                }
                <TextInfo color={riskColor} message="How much of the maximum borrow capacity is used, at 100% the loan can be liquidated">
                    <Text fontSize={fontSize} fontWeight="bold" color={riskColor}>You will use <b style={{ fontWeight: '1000' }}>{shortenNumber(100-newPerc, 2)}%</b> of your Borrow Limit</Text>
                </TextInfo>
                <TextInfo color={riskColor} message="If the collateral price reaches that price, your collateral can be liquidated entirely">
                    <Text fontSize={fontSize} fontWeight="bold" color={riskColor}>Your liquidation price will be <b style={{ fontWeight: '1000' }}>{preciseCommify(newLiquidationPrice, 0, true)}</b> (current price is {preciseCommify(market.price, 0, true)})</Text>
                </TextInfo>
            </>
        }
    </VStack>
}