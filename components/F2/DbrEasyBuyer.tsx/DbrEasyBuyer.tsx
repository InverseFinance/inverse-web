import { Image, useDisclosure, VStack, Text } from "@chakra-ui/react"
import { AutoBuyDbrDurationInputs } from "../forms/FirmFormSubcomponents/FirmDbrHelper";
import { useEffect, useState } from "react";
import { useAccount } from "@app/hooks/misc";
import { useAccountDBR, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap";
import { useSavingsOpportunities } from "@app/components/sDola/SavingsOpportunities";
import { DBR_ADDRESS } from "@app/config/constants";
import SimpleModal from "@app/components/common/Modal/SimpleModal";
import { preciseCommify } from "@app/util/misc";
import { shortenNumber } from "@app/util/markets";
import { InfoMessage } from "@app/components/common/Messages";

export const DbrFloatingTrigger = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return <>
        <Image
            src="/assets/v2/dbr.png"
            position="fixed"
            bottom="20px"
            right="20px"
            w="50px"
            h="50px"
            cursor="pointer"
            zIndex="1"
            borderRadius="full"
            shadow="0 0 10px 0 rgba(0, 0, 0, 0.1)"
            border="1px solid white"
            borderColor="mainTextColor"
            _hover={{
                transform: "scale(1.05)",
                filter: "brightness(1.1)",
                transition: "transform 0.2s ease-in-out"
            }}
            onClick={onOpen}
        />
        {
            isOpen && <DbrEasyBuyerModal onClose={onClose} />
        }
    </>
}

export const DbrEasyBuyerModal = ({
    onClose,
}: {
    onClose: () => void
}) => {
    const account = useAccount();
    const { topStable } = useSavingsOpportunities(account);

    const { debt, dbrExpiryDate } = useAccountDBR(account);
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(3);
    const [dbrBuySlippage, setDbrBuySlippage] = useState('0.3');
    const [debtToCover, setDebtToCover] = useState(0);
    const [isInited, setIsInited] = useState(false);

    const dbrNeeded = debtToCover / 365 * duration;
    const dbrUsdCost = dbrNeeded * dbrPriceUsd;
    const { price: dbrRate } = useTriCryptoSwap(dbrUsdCost, 0, 1);
    const effectiveSwapPrice = dbrRate ? 1/dbrRate : 0;
    const dbrUsdCostWithSlippage = dbrNeeded * effectiveSwapPrice;

    useEffect(() => {
        if (isInited || !debt) return;
        setIsInited(true);
        setDebtToCover(debt.toFixed(0));
    }, [isInited, debt]);

    const handleDurationChange = (duration: number, typedValue: number, type: string) => {
        setDurationTypedValue(typedValue);
        setDurationType(type);
        setDuration(duration);
    }

    const handleDebtChange = (value: string) => {
        setDebtToCover(value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
    }

    const dbrDurationInputs = <AutoBuyDbrDurationInputs
        duration={duration}
        durationType={durationType}
        durationTypedValue={durationTypedValue}
        handleDurationChange={handleDurationChange}
        dbrBuySlippage={dbrBuySlippage}
        setDbrBuySlippage={setDbrBuySlippage}
        dbrPriceUsd={dbrPriceUsd}
        userDebt={debt}
        debtToCover={debtToCover}
        handleDebtChange={handleDebtChange}
        isDexMode={true}
    />

    return <SimpleModal
        title="DBR calculator & buyer"
        isOpen={true}
        onClose={onClose}
        modalProps={{
            scrollBehavior: 'inside',
            minW: { base: '98vw', lg: '700px' }
        }}
    >
        <VStack p="4" alignItems="flex-start" w='full'>
            {dbrDurationInputs}
            <InfoMessage
                alertProps={{ w: 'full', fontSize: '14px' }}
                description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>
                            Amount needed to cover the debt and duration: <b>{preciseCommify(dbrNeeded, 0)} DBR (~{shortenNumber(dbrUsdCost, 2, true)})</b>
                        </Text>
                        <Text>
                            Note: You might need to adjust the estimated sell amount to account for price slippage
                        </Text>
                    </VStack>
                }
            />
            <EnsoZap
                defaultTokenIn={topStable?.token?.address}
                defaultTokenOut={DBR_ADDRESS}
                defaultAmountIn={dbrUsdCostWithSlippage?.toFixed(0) || ''}
                defaultTargetChainId={'1'}
                ensoPools={[{ poolAddress: DBR_ADDRESS, chainId: 1 }]}
                introMessage={''}
                isSingleChoice={true}
                targetAssetPrice={dbrPriceUsd}
                isInModal={true}
                onlyFromStables={true}
                isDbrCoveringCase={true}
                userDebt={debt}
                fromText={"Asset to sell to Buy DBR with"}
            />
        </VStack>
    </SimpleModal>
}