import { InfoMessage } from "@app/components/common/Messages";
import { Modal } from "@app/components/common/Modal"
import ScannerLink from "@app/components/common/ScannerLink";
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm";
import { useAccountDBRMarket } from "@app/hooks/useDBR";
import { f2liquidate } from "@app/util/f2";
import { shortenNumber } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks";
import { HStack, VStack, Text } from "@chakra-ui/react";
import { useWeb3React } from "@web3-react/core";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";

const { DOLA } = getNetworkConfigConstants();

export const FirmLiquidationModal = ({
    position,
    onOpen,
    onClose,
    isOpen,
}: {
    position: any,
    onOpen: () => void,
    onClose: () => void,
    isOpen: boolean,
}) => {
    const { library, account } = useWeb3React();

    const liveData = useAccountDBRMarket(position.market, position.user);

    const debt = liveData.debt ?? position.debt;
    const liquidatableDebt = liveData.liquidatableDebt ?? position.liquidatableDebt;
    const seizable = liveData.seizable ?? position.seizable;
    const seizableWorth = liveData.seizableWorth ?? position.seizableWorth;

    const [repayAmount, setRepayAmount] = useState('');
    const [seizeAmount, setSeizeAmount] = useState(0);
    const [seizeWorth, setSeizeWorth] = useState(0);

    const handleLiquidation = async (repayAmountBn: BigNumber) => {
        return f2liquidate(library?.getSigner(), position.user, position.market.address, repayAmountBn);
    }

    useEffect(() => {
        setRepayAmount('');
        setSeizeAmount(0);
        setSeizeWorth(0);
    }, [position?.key])

    useEffect(() => {
        if (!position) { return }
        const repayFloat = parseFloat(repayAmount) || 0;
        const seizeWorth = repayFloat + repayFloat * position.market.liquidationIncentive;
        setSeizeWorth(seizeWorth);
        setSeizeAmount(seizeWorth / position.market.price);
    }, [repayAmount, position]);

    return  <Modal
    header={`Liquidation Form`}
    onClose={onClose}
    isOpen={isOpen}
>
    {
        !!position &&
        <VStack w='full' p="4">
            <HStack w='full' justify="space-between">
                <Text>Borrower:</Text>
                <ScannerLink value={position.user} />
            </HStack>
            {
                position?.liquidatableDebt !== debt &&
                <HStack w='full' justify="space-between">
                    <Text>Debt:</Text>
                    <Text fontWeight="bold">{shortenNumber(debt, 2)}</Text>
                </HStack>
            }
            <HStack w='full' justify="space-between">
                <Text>Liquidable Debt:</Text>
                <Text fontWeight="bold">{shortenNumber(liquidatableDebt, 2)}</Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>Liquidation Incentive:</Text>
                <Text fontWeight="bold">{position?.market.liquidationIncentive * 100}%</Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>Max Seizable:</Text>
                <Text fontWeight="bold">
                    {shortenNumber(seizable, 4, false, true)} {position?.market.underlying.symbol} ({shortenNumber(seizableWorth, 2, true)})
                </Text>
            </HStack>
            {
                !account && <InfoMessage alertProps={{ w: 'full' }} description="Please connect wallet" />
            }

            {
                position.isLiquidatable && !!account &&
                <VStack pt="4" w='full' alignItems="flex-start">
                    <Text fontWeight="bold">Amount to repay:</Text>
                    <SimpleAmountForm
                        defaultAmount={repayAmount}
                        address={DOLA}
                        destination={position?.market.address}
                        signer={library?.getSigner()}
                        decimals={18}
                        hideInputIfNoAllowance={false}
                        maxAmountFrom={[position?.liquidatableDebtBn]}
                        includeBalanceInMax={true}
                        onAction={({ bnAmount }) => handleLiquidation(bnAmount)}
                        onAmountChange={(v) => setRepayAmount(v)}
                        showMaxBtn={false}
                        showNotEnoughTokenMsg={true}
                        actionLabel="Liquidate"
                    />
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            seizeAmount > 0 ? `You will seize: ${shortenNumber(seizeAmount, 4)} (${shortenNumber(seizeWorth, 2, true)})` : 'Repay a DOLA amount to seize collateral'
                        }
                    />
                </VStack>
            }
        </VStack>
    }
</Modal>
}