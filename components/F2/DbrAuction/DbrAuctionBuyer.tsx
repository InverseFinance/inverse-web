import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { DBR_AUCTION_HELPER_ADDRESS, swapDolaForExactDbr, swapExactDolaForDbr } from "@app/util/dbr-auction"
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useWeb3React } from "@web3-react/core";
import { getBnToNumber, getNumberToBn, shortenNumber, smartShortNumber } from "@app/util/markets";
import { TextInfo } from "../../common/Messages/TextInfo";
import { SimpleAmountForm } from "../../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { Input } from "../../common/Input";
import Container from "../../common/Container";
import { useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import { NavButtons } from "@app/components/common/Button";
import { useDOLAPriceLive } from "@app/hooks/usePrices";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";

const { DOLA } = getNetworkConfigConstants();

const defaultRefAmount = '1';

const ListLabelValues = ({ items }: { items: { label: string, value: string | any, color?: string }[] }) => {
    return <VStack w='full' spacing="2" alignItems="flex-start">
        {
            items.map(item => {
                return <HStack key={item.label} w='full' justify="space-between">
                    <Text fontSize="14px" color={item.color}>
                        {item.label}:
                    </Text>
                    {typeof item.value === 'string' ? <Text color={item.color} fontSize="14px" fontWeight="bold">{item.value}</Text> : item.value}
                </HStack>
            })
        }
    </VStack>
}

export const DbrAuctionBuyer = () => {
    const { price: dolaPrice } = useDOLAPriceLive();
    const { provider, account } = useWeb3React();
    const [dolaAmount, setDolaAmount] = useState('');
    const [dbrAmount, setDbrAmount] = useState('');

    const [slippage, setSlippage] = useState('1');
    const [tab, setTab] = useState('Sell exact DOLA');
    const isExactDola = tab === 'Sell exact DOLA';
    const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(dolaAmount || defaultRefAmount), 0, 1);
    const { data, error } = useEtherSWR([
        [DBR_AUCTION_HELPER_ADDRESS, 'getDbrOut', parseEther(dolaAmount || defaultRefAmount)],
        [DBR_AUCTION_HELPER_ADDRESS, 'getDbrOut', parseEther(defaultRefAmount)],
        [DBR_AUCTION_HELPER_ADDRESS, 'getDolaIn', parseEther(dbrAmount || defaultRefAmount)],
        [DBR_AUCTION_HELPER_ADDRESS, 'getDolaIn', parseEther(defaultRefAmount)],
    ]);
    const { priceUsd: dbrPrice } = useDBRPrice();

    const refDbrOut = data && data[1] ? getBnToNumber(data[1]) : 0;
    const estimatedDbrOut = data && data[0] && !!dolaAmount ? getBnToNumber(data[0]) : 0;
    const minDbrOut = data && data[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const refDolaIn = data && data[3] ? getBnToNumber(data[3]) : 0;

    const estimatedDolaIn = data && data[2] && !!dbrAmount ? getBnToNumber(data[2]) : 0;
    const maxDolaIn = data && data[2] ? getNumberToBn(estimatedDolaIn * (1 + parseFloat(slippage) / 100)) : BigNumber.from('0');

    const minDbrOutNum = getBnToNumber(minDbrOut);
    const maxDolaInNum = getBnToNumber(maxDolaIn);

    const dbrAuctionPrice = isExactDola ?
        (estimatedDbrOut > 0 ? estimatedDbrOut / parseFloat(dolaAmount) : refDbrOut / parseFloat(defaultRefAmount))
        :
        (estimatedDolaIn > 0 ? parseFloat(dbrAmount) / estimatedDolaIn : refDolaIn > 0 ? parseFloat(defaultRefAmount) / refDolaIn : 0);
    const auctionPriceColor = !dbrSwapPrice || !dbrAuctionPrice ? undefined : dbrAuctionPrice >= dbrSwapPrice ? 'success' : 'warning';

    const isInvalidSlippage = !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;
    const isExactDolaBtnDisabled = isInvalidSlippage || !dolaAmount || parseFloat(dolaAmount) <= 0;
    const isExactDbrBtnDisabled = isInvalidSlippage || !dbrAmount || parseFloat(dbrAmount) <= 0;

    const auctionSlippageInput = <Input
        py="0"
        maxH="30px"
        w='90px'
        value={slippage}
        isInvalid={isInvalidSlippage}
        _focusVisible={false}
        onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))}
    />;

    const sell = async () => {
        if (isExactDola) {
            return swapExactDolaForDbr(provider?.getSigner(), parseEther(dolaAmount), minDbrOut);
        }
        return swapDolaForExactDbr(provider?.getSigner(), maxDolaIn, parseEther(dbrAmount));
    }

    return <Container
        label="DBR auction of type K=xy"
        description="See contract"
        href={`https://etherscan.io/address/${DBR_AUCTION_HELPER_ADDRESS}`}
        noPadding
        m="0"
        p="0"
        maxW='450px'>
        <VStack spacing="4" alignItems="flex-start" w='full'>
            {
                !account ? <InfoMessage description="Please connect your wallet" />
                    :
                    <>
                        <NavButtons active={tab} options={['Sell exact DOLA', 'Buy exact DBR']} onClick={(v) => setTab(v)} />
                        {
                            isExactDola ?
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DOLA in exchange for DBR, the auction formula is of type K=xy">
                                        <Text>Exact amount DOLA to sell</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        defaultAmount={dolaAmount}
                                        address={DOLA}
                                        destination={DBR_AUCTION_HELPER_ADDRESS}
                                        signer={provider?.getSigner()}
                                        decimals={18}
                                        onAction={() => sell()}
                                        actionLabel={`Sell DOLA for DBR`}
                                        onAmountChange={(v) => setDolaAmount(v)}
                                        showMaxBtn={false}
                                        hideInputIfNoAllowance={false}
                                        showBalance={true}
                                        isDisabled={isExactDolaBtnDisabled}
                                        checkBalanceOnTopOfIsDisabled={true}
                                    />
                                </VStack>
                                :
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DBR in exchange for DOLA, the auction formula is of type K=xy">
                                        <Text>Exact amount of DBR to buy</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        defaultAmount={dbrAmount}
                                        address={DOLA}
                                        destination={DBR_AUCTION_HELPER_ADDRESS}
                                        signer={provider?.getSigner()}
                                        decimals={18}
                                        onAction={() => sell()}
                                        actionLabel={`Buy a precise amount of DBR`}
                                        onAmountChange={(v) => setDbrAmount(v)}
                                        showMaxBtn={false}
                                        showMax={false}
                                        hideInputIfNoAllowance={false}
                                        showBalance={false}
                                        isDisabled={isExactDbrBtnDisabled}
                                        checkBalanceOnTopOfIsDisabled={true}
                                    />
                                </VStack>
                        }
                        <Divider />
                        <ListLabelValues items={[
                            (isExactDola ?
                                { label: `Estimated amount to receive`, value: estimatedDbrOut > 0 ? `${shortenNumber(estimatedDbrOut, 2)} DBR (${shortenNumber(estimatedDbrOut * dbrPrice, 2, true)})` : '-' }
                                : { label: `Estimated amount to sell`, value: estimatedDolaIn > 0 ? `${shortenNumber(estimatedDolaIn, 2)} DOLA (${shortenNumber(estimatedDolaIn * dolaPrice||1, 2, true)})` : '-' }
                            ),
                            { label: `Price via auction`, color: auctionPriceColor, value: dbrAuctionPrice > 0 ? `~${shortenNumber(dbrAuctionPrice, 2)} DBR per DOLA` : '-' },
                            { label: `Price via Curve`, value: !isCurvePriceLoading && dbrSwapPrice > 0 ? `~${shortenNumber(dbrSwapPrice, 2)} DBR per DOLA` : '-' },
                        ]} />
                        <Divider />
                        <ListLabelValues items={[
                            { label: `Max. slippage %`, value: auctionSlippageInput },
                            (isExactDola ?
                                { label: `Min. DBR to receive`, value: minDbrOutNum > 0 ? `${smartShortNumber(minDbrOutNum, 2, false, true)} DBR (${shortenNumber(minDbrOutNum * dbrPrice, 2, true)})` : '-' }
                                :
                                { label: `Max. DOLA to send`, value: maxDolaInNum > 0 ? `${smartShortNumber(maxDolaInNum, 2, false, true)} DBR (${shortenNumber(maxDolaInNum * dolaPrice, 2, true)})` : '-' }
                            ),
                        ]} />
                    </>
            }
        </VStack>
    </Container>
}