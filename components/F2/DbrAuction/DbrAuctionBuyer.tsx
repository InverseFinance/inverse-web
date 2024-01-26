import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { estimateAuctionTimeToReachMarketPrice, swapDolaForExactDbr, swapExactDolaForDbr } from "@app/util/dbr-auction"
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useWeb3React } from "@web3-react/core";
import { getBnToNumber, getNumberToBn, shortenNumber } from "@app/util/markets";
import { TextInfo } from "../../common/Messages/TextInfo";
import { SimpleAmountForm } from "../../common/SimpleAmountForm";
import { useEffect, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { Input } from "../../common/Input";
import Container from "../../common/Container";
import { useAccountDBR, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import { NavButtons } from "@app/components/common/Button";
import { useDOLAPriceLive } from "@app/hooks/usePrices";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { useDbrAuction } from "./DbrAuctionInfos";
import moment from "moment";
import { DBR_AUCTION_HELPER_ADDRESS, ONE_DAY_SECS } from "@app/config/constants";
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect";

const { DOLA } = getNetworkConfigConstants();

const defaultRefClassicAmount = '1';
const defaultRefSdolaAmount = '0.999';

const ListLabelValues = ({ items }: { items: { label: string, value: string | any, color?: string, isLoading?: boolean }[] }) => {
    return <VStack w='full' spacing="2" alignItems="flex-start">
        {
            items.filter(item => !!item).map(item => {
                return <HStack key={item.label} w='full' justify="space-between">
                    <Text fontSize="14px" color={item.color}>
                        {item.label}:
                    </Text>
                    {item.isLoading ? <SmallTextLoader height="10px" /> : typeof item.value === 'string' ? <Text color={item.color} fontSize="14px" fontWeight="bold">{item.value}</Text> : item.value}
                </HStack>
            })
        }
    </VStack>
}

export const DbrAuctionBuyer = ({
    helperAddress = DBR_AUCTION_HELPER_ADDRESS,
}) => {
    const { price: dolaPrice } = useDOLAPriceLive();
    const { provider, account } = useWeb3React();
    const [dolaAmount, setDolaAmount] = useState('');
    const [dbrAmount, setDbrAmount] = useState('');
    const [estimatedTimeToReachMarketPrice, setEstimatedTimeToReachMarketPrice] = useState(0);
    const [isConnected, setIsConnected] = useState(true);
    const { signedBalance: dbrBalance, dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    const { balance: dolaBalance } = useDOLABalance(account);

    const [slippage, setSlippage] = useState('1');
    const [tab, setTab] = useState('Sell DOLA');
    const isExactDola = tab === 'Sell DOLA';
    const isClassicDbrAuction = helperAddress === DBR_AUCTION_HELPER_ADDRESS;
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;
    const { dolaReserve, dbrReserve, dbrRatePerYear } = useDbrAuction(isClassicDbrAuction);

    const { price: dbrSwapPriceRef } = useTriCryptoSwap(parseFloat(defaultRefAmount), 0, 1);
    const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(!dolaAmount || dolaAmount === '0' ? defaultRefAmount : dolaAmount), 0, 1);
    const { data, error } = useEtherSWR([
        [helperAddress, 'getDbrOut', parseEther(dolaAmount || defaultRefAmount)],
        [helperAddress, 'getDbrOut', parseEther(defaultRefAmount)],
        [helperAddress, 'getDolaIn', parseEther(dbrAmount || defaultRefAmount)],
        [helperAddress, 'getDolaIn', parseEther(defaultRefAmount)],
    ]);
    
    const isLoading = isCurvePriceLoading || (!data && !error);

    const { priceUsd: dbrPrice } = useDBRPrice();

    const refDbrOut = data && data[1] ? getBnToNumber(data[1]) : 0;
    const estimatedDbrOut = data && data[0] && !!dolaAmount ? getBnToNumber(data[0]) : 0;
    const minDbrOut = data && data[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const refDolaIn = data && data[3] ? getBnToNumber(data[3]) : 0;
    const refAuctionPriceInDola = data ? parseFloat(defaultRefAmount) / refDbrOut : 0;

    const estimatedDolaIn = data && data[2] && !!dbrAmount ? getBnToNumber(data[2]) : 0;
    const maxDolaIn = data && data[2] ? getNumberToBn(estimatedDolaIn * (1 + parseFloat(slippage) / 100)) : BigNumber.from('0');

    const minDbrOutNum = getBnToNumber(minDbrOut);
    const maxDolaInNum = getBnToNumber(maxDolaIn);

    const dbrAuctionPrice = isExactDola ?
        (estimatedDbrOut > 0 ? estimatedDbrOut / parseFloat(dolaAmount) : refDbrOut / parseFloat(defaultRefAmount))
        :
        (estimatedDolaIn > 0 ? parseFloat(dbrAmount) / estimatedDolaIn : refDolaIn > 0 ? parseFloat(defaultRefAmount) / refDolaIn : 0);

    const dbrAuctionPriceInDola = dbrAuctionPrice ? 1 / dbrAuctionPrice : 0;
    const dbrSwapPriceInDola = dbrSwapPrice ? 1 / dbrSwapPrice : 0;
    const dbrSwapPriceRefInDola = dbrSwapPriceRef ? 1 / dbrSwapPriceRef : 0;
    const estimatedTimestampToReachMarketPrice = (estimatedTimeToReachMarketPrice * 1000) + Date.now();

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
            return swapExactDolaForDbr(provider?.getSigner(), parseEther(dolaAmount), minDbrOut, helperAddress);
        }
        return swapDolaForExactDbr(provider?.getSigner(), maxDolaIn, parseEther(dbrAmount), helperAddress);
    }

    const resetForm = () => {
        setDolaAmount('');
        setDbrAmount('');
    }

    useDualSpeedEffect(() => {
        setIsConnected(!!account);
    }, [account], !!account, 1000, 0);

    useEffect(() => {
        if (!dbrSwapPriceRefInDola || !dolaReserve || !dbrRatePerYear || !dbrReserve) return;
        if (dbrSwapPriceRefInDola > refAuctionPriceInDola) {
            setEstimatedTimeToReachMarketPrice(0);
            return;
        }
        setEstimatedTimeToReachMarketPrice(
            estimateAuctionTimeToReachMarketPrice(dolaReserve, dbrReserve, dbrRatePerYear, dbrSwapPriceRefInDola)
        );
    }, [dbrSwapPriceRefInDola, refAuctionPriceInDola, dolaReserve, dbrReserve, dbrRatePerYear]);

    return <Container
        label="DBR XY=K Auction"
        description="See contract"
        href={`https://etherscan.io/address/${helperAddress}`}
        noPadding
        m="0"
        p="0"
        maxW='550px'>
        <VStack spacing="4" alignItems="flex-start" w='full'>
            {
                !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                    :
                    <>
                        <NavButtons active={tab} options={['Sell DOLA', 'Buy DBR']} onClick={(v) => setTab(v)} />
                        <HStack w='full' justify="space-between">
                            <Text fontSize="14px">
                                DBR balance: {preciseCommify(dbrBalance, 2)}
                            </Text>
                            <Text fontSize="14px">
                                DOLA balance: {preciseCommify(dolaBalance, 2)}
                            </Text>
                        </HStack>
                        {
                            isExactDola ?
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DOLA in exchange for DBR, the auction formula is of type K=xy">
                                        <Text fontWeight="bold" fontSize="14px">Exact amount DOLA to sell:</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        btnProps={{ needPoaFirst:true }}
                                        defaultAmount={dolaAmount}
                                        address={DOLA}
                                        destination={helperAddress}
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
                                        onSuccess={() => resetForm()}
                                    />
                                </VStack>
                                :
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DBR in exchange for DOLA, the auction formula is of type K=xy">
                                        <Text fontWeight="bold" fontSize="14px">Exact amount of DBR to buy:</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        btnProps={{ needPoaFirst:true }}
                                        defaultAmount={dbrAmount}
                                        address={DOLA}
                                        destination={helperAddress}
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
                                        onSuccess={() => resetForm()}
                                    />
                                </VStack>
                        }
                        <Divider />
                        <ListLabelValues items={[
                            (isExactDola ?
                                { label: `Estimated amount to receive`, isLoading, value: estimatedDbrOut > 0 ? `${preciseCommify(estimatedDbrOut, 2)} DBR (${shortenNumber(estimatedDbrOut * dbrPrice, 2, true)})` : '-' }
                                : { label: `Estimated amount to sell`, isLoading, value: estimatedDolaIn > 0 ? `${preciseCommify(estimatedDolaIn, 2)} DOLA (${shortenNumber(estimatedDolaIn * dolaPrice || 1, 2, true)})` : '-' }
                            ),
                            { label: `Price via auction`, color: auctionPriceColor, isLoading, value: dbrAuctionPrice > 0 ? `~${shortenNumber(dbrAuctionPriceInDola, 4)} DOLA (${shortenNumber(dbrAuctionPriceInDola * dolaPrice, 4, true)})` : '-' },
                            { label: `Market price via Curve`, isLoading, value: !isCurvePriceLoading && dbrSwapPrice > 0 ? `~${shortenNumber(dbrSwapPriceInDola, 4)} DOLA (${shortenNumber(dbrSwapPriceInDola * dolaPrice, 4, true)})` : '-' },
                            estimatedTimeToReachMarketPrice <= 300 ? undefined : { label: `Est. time for the auction to reach the market price`, isLoading, value: estimatedTimeToReachMarketPrice > ONE_DAY_SECS ? `~${shortenNumber((estimatedTimeToReachMarketPrice / ONE_DAY_SECS), 2)} days` : `${moment(estimatedTimestampToReachMarketPrice).fromNow()}` },
                        ]} />
                        <Divider />
                        <ListLabelValues items={[
                            { label: `Max. slippage %`, value: auctionSlippageInput },
                            (isExactDola ?
                                { label: `Min. DBR to receive`, isLoading, value: minDbrOutNum > 0 ? `${preciseCommify(minDbrOutNum, 2, false, true)} DBR (${shortenNumber(minDbrOutNum * dbrPrice, 2, true)})` : '-' }
                                :
                                { label: `Max. DOLA to send`, isLoading, value: maxDolaInNum > 0 ? `${preciseCommify(maxDolaInNum, 2, false, true)} DOLA (${shortenNumber(maxDolaInNum * dolaPrice, 2, true)})` : '-' }
                            ),
                        ]} />
                    </>
            }
        </VStack>
    </Container>
}