import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { DBR_AUCTION_ADDRESS, sellDolaForDbr } from "@app/util/dbr-auction"
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
    const { provider } = useWeb3React();
    const [amount, setAmount] = useState('');
    const [slippage, setSlippage] = useState('1');
    const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(amount || defaultRefAmount), 0, 1);
    const { data } = useEtherSWR([
        [DBR_AUCTION_ADDRESS, 'getDbrOut', parseEther(amount || '0')],
        [DBR_AUCTION_ADDRESS, 'getDbrOut', parseEther(defaultRefAmount)],
    ]);
    const { price: dbrPrice } = useDBRPrice();    
    const refDbrOut = data && data[1] ? getBnToNumber(data[1]) : 0;
    const estimatedDbrOut = data && data[0] ? getBnToNumber(data[0]) : 0;
    const minDbrOut = data && data[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');
    const minDbrOutNum = getBnToNumber(minDbrOut);
    const dbrAuctionPrice = estimatedDbrOut > 0 ? estimatedDbrOut / parseFloat(amount) : refDbrOut / parseFloat(defaultRefAmount);
    const auctionPriceColor = !dbrSwapPrice || !dbrAuctionPrice ? undefined : dbrAuctionPrice >= dbrSwapPrice ? 'success' : 'warning';
    const isInvalidSlippage = !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;
    const isDisabled = isInvalidSlippage || !amount || parseFloat(amount) <= 0;

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
        return sellDolaForDbr(provider?.getSigner(), parseEther(amount), minDbrOut);
    }

    return <Container
        label="DBR auction of type K=xy"
        description="See contract"
        href={`https://etherscan.io/address/${DBR_AUCTION_ADDRESS}`}
        noPadding
        m="0"
        p="0"
        maxW='400px'>
        <VStack spacing="4" alignItems="flex-start" w='full'>
            <VStack w='full' alignItems="flex-start">
                <TextInfo message="Sell DOLA in exchange for DBR, the auction formula is of type K=xy">
                    <Text>Amount of DOLA to sell</Text>
                </TextInfo>
                <SimpleAmountForm
                    defaultAmount={amount}
                    address={DOLA}
                    destination={DBR_AUCTION_ADDRESS}
                    signer={provider?.getSigner()}
                    decimals={18}
                    onAction={() => sell()}
                    actionLabel={'Buy DBR'}
                    onAmountChange={(v) => setAmount(v)}
                    showMaxBtn={false}
                    hideInputIfNoAllowance={false}
                    showBalance={true}
                    isDisabled={isDisabled}
                    checkBalanceOnTopOfIsDisabled={true}
                />
            </VStack>
            <Divider />
            <ListLabelValues items={[
                { label: `Estimated amount to receive`, value: estimatedDbrOut > 0 ? `${shortenNumber(estimatedDbrOut, 2)} DBR (${shortenNumber(estimatedDbrOut * dbrPrice, 2, true)})` : '-' },
                { label: `Price via auction`, color: auctionPriceColor, value: dbrAuctionPrice > 0 ? `~${shortenNumber(dbrAuctionPrice, 2)} DBR per DOLA` : '-' },
                { label: `Price via Curve`, value: !isCurvePriceLoading && dbrSwapPrice > 0 ? `~${shortenNumber(dbrSwapPrice, 2)} DBR per DOLA` : '-' },
            ]} />
            <Divider />
            <ListLabelValues items={[
                { label: `Max. slippage %`, value: auctionSlippageInput },
                { label: `Min. to receive`, value: minDbrOutNum > 0 ? `${smartShortNumber(minDbrOutNum, 2, false, true)} DBR (${shortenNumber(minDbrOutNum * dbrPrice, 2, true)})` : '-' },
            ]} />
        </VStack>
    </Container>
}