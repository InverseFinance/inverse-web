import { VStack, Text, HStack, Divider, Badge } from "@chakra-ui/react"
import { swapDolaForExactDbr, swapExactDolaForDbr, useDbrAuctionPricing } from "@app/util/dbr-auction"
import { useWeb3React } from "@web3-react/core";
import { shortenNumber } from "@app/util/markets";
import { TextInfo } from "../../common/Messages/TextInfo";
import { SimpleAmountForm } from "../../common/SimpleAmountForm";
import { useEffect, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import { Input } from "../../common/Input";
import Container from "../../common/Container";
import { useAccountDBR, useDBRMarkets, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import { NavButtons } from "@app/components/common/Button";
import { useDOLAPriceLive } from "@app/hooks/usePrices";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { DbrAuctionParametersWrapper } from "./DbrAuctionInfos";
import moment from "moment";
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, DOLA_SAVINGS_ADDRESS, ONE_DAY_SECS, SDOLA_HELPER_ADDRESS, SINV_ADDRESS, SINV_HELPER_ADDRESS } from "@app/config/constants";
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect";
import { RadioCardGroup } from "@app/components/common/Input/RadioCardGroup";
import { DbrAuctionType } from "@app/types";
import { swapExactInvForDbr } from "@app/util/sINV";
import { useINVBalance } from "@app/hooks/useBalances";

const { DOLA, INV } = getNetworkConfigConstants();

const defaultRefClassicAmount = '1';
const defaultRefSdolaAmount = '1';

const EXACT_DBR = 'Buy DBR';
const SELL_DOLA = 'Sell DOLA';
const SELL_INV = 'Sell INV';
const INFOS = 'Info';
const TAB_OPTIONS = [SELL_DOLA, SELL_INV, INFOS];

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

const AuctionRadioOption = ({ label, dbrAuctionPriceInDola, dolaPrice, isBest }) => {
    return <VStack position="relative" spacing="1">
        {
            isBest && <Badge
                bgColor="secondary"
                textTransform="none"
                fontSize="14px"
                color="contrastMainTextColor"
                position="absolute"
                top="-8"
                right="-4"
                px="2"
                py="1"
            >
                Best rate
            </Badge>
        }
        <Text>{label}</Text>
        <Text fontWeight="bold">
            {!dbrAuctionPriceInDola ? '-' : `${shortenNumber(dbrAuctionPriceInDola, 4)} DOLA (${shortenNumber(dolaPrice * dbrAuctionPriceInDola, 4, true)})`}
        </Text>
    </VStack>
}

const AUCTION_TYPES = {
    'classic': {
        auction: DBR_AUCTION_ADDRESS,
        helper: DBR_AUCTION_HELPER_ADDRESS,
    },
    'sdola': {
        auction: DOLA_SAVINGS_ADDRESS,
        helper: SDOLA_HELPER_ADDRESS,
    },
    'sinv': {
        auction: SINV_ADDRESS,
        helper: SINV_HELPER_ADDRESS,
    },
}

const getArbitrageValue = (dolaAmount: string, auctionPrice: number, marketSwapPrice: number, dbrPrice: number) => {
    if (!(auctionPrice > 0 && marketSwapPrice > 0 && dbrPrice > 0)) {
        return;
    }
    const auctionWorth = parseFloat(dolaAmount) * 1 / auctionPrice * dbrPrice;
    const swapWorth = parseFloat(dolaAmount) * 1 / marketSwapPrice * dbrPrice;
    return auctionWorth - swapWorth;
}

export const DbrAuctionBuyer = ({
    title,
}) => {
    const { price: dolaPrice } = useDOLAPriceLive();
    const { markets, isLoading: isLoadingMarkets } = useDBRMarkets();
    const invMarket = markets?.find(m => m.isInv);
    const invPrice = invMarket?.price||0;
    const { provider, account } = useWeb3React();
    const [dolaAmount, setDolaAmount] = useState('');
    const [invAmount, setInvAmount] = useState('');
    const [dbrAmount, setDbrAmount] = useState('');
    const [dolaAuctionType, setDolaAuctionType] = useState<DbrAuctionType>('classic');
    const [isInited, setIsInited] = useState(false);
    const [bestAuctionSrc, setBestAuctionSrc] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const { signedBalance: dbrBalance } = useAccountDBR(account);
    const { balance: dolaBalance } = useDOLABalance(account);
    const { balance: invBalance } = useINVBalance(account);

    const [slippage, setSlippage] = useState('1');
    const [tab, setTab] = useState(TAB_OPTIONS[0]);
    const isSellMode = tab === SELL_DOLA || tab === SELL_INV;
    const isExactDola = tab === SELL_DOLA;
    const isExactInv = tab === SELL_INV;
    const selectedAuction = isExactInv ? 'sinv' : dolaAuctionType;
    const isClassicDbrAuction = dolaAuctionType === 'classic';
    const sellTokenSymobl = isExactInv ? 'INV' : 'DOLA';
    const sellTokenPrice = tab === SELL_DOLA ? dolaPrice : invPrice;
    const helperAddress = AUCTION_TYPES[selectedAuction].helper;
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;

    const srcIndex = isExactInv ? 2 : 0;
    const { price: dbrSwapPriceRef } = useTriCryptoSwap(parseFloat(defaultRefAmount), srcIndex, 1);
    const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(!dolaAmount || dolaAmount === '0' ? defaultRefAmount : dolaAmount), srcIndex, 1);

    const dbrSwapPriceInToken = dbrSwapPrice ? 1 / dbrSwapPrice : 0;
    const dbrSwapPriceRefInToken = dbrSwapPriceRef ? 1 / dbrSwapPriceRef : 0;

    const classicAuctionPricingData = useDbrAuctionPricing({ auctionType: 'classic', helperAddress: DBR_AUCTION_HELPER_ADDRESS, tokenAmount: dolaAmount, dbrAmount, slippage, isExactToken: isSellMode, dbrSwapPriceRefInToken: dbrSwapPriceRefInToken });
    const sdolaAuctionPricingData = useDbrAuctionPricing({ auctionType: 'sdola', helperAddress: SDOLA_HELPER_ADDRESS, tokenAmount: dolaAmount, dbrAmount, slippage, isExactToken: isSellMode, dbrSwapPriceRefInToken: dbrSwapPriceRefInToken });
    const sinvAuctionPricingData = useDbrAuctionPricing({ auctionType: 'sinv', helperAddress: SINV_HELPER_ADDRESS, tokenAmount: invAmount, dbrAmount, slippage, isExactToken: isSellMode, dbrSwapPriceRefInToken: dbrSwapPriceRefInToken });
    const selectedAuctionData = isExactInv ? sinvAuctionPricingData : (isClassicDbrAuction ? classicAuctionPricingData : sdolaAuctionPricingData);
    const {
        estimatedTimestampToReachMarketPrice,
        estimatedTimeToReachMarketPrice,
        dbrAuctionPriceInToken,
        minDbrOut,
        maxTokenIn,
        minDbrOutNum,
        maxTokenInNum,
        estimatedTokenIn,
        estimatedDbrOut,
    } = selectedAuctionData;

    const isLoading = isCurvePriceLoading || classicAuctionPricingData?.isLoading || sdolaAuctionPricingData?.isLoading || (!selectedAuctionData);

    const { priceUsd: dbrPrice } = useDBRPrice();

    const auctionPriceColor = !dbrSwapPriceInToken || !selectedAuctionData?.dbrAuctionPriceInToken ? undefined : selectedAuctionData?.dbrAuctionPriceInToken < dbrSwapPriceInToken ? 'success' : 'warning';

    const isInvalidSlippage = !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;
    const tokenAmount = isExactDola ? dolaAmount : invAmount;
    const tokenBalance = isExactDola ? dolaBalance : invBalance;
    const notEnoughToken = !!tokenAmount && (isSellMode ? tokenBalance < parseFloat(tokenAmount) : tokenBalance < maxTokenInNum);
    const isExactTokenBtnDisabled = isInvalidSlippage || !tokenAmount || parseFloat(tokenAmount) <= 0;
    const isExactDbrBtnDisabled = isInvalidSlippage || !dbrAmount || parseFloat(dbrAmount) <= 0 || (notEnoughToken);

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
        else if (isExactInv) {
            return swapExactInvForDbr(provider?.getSigner(), parseEther(invAmount), minDbrOut);
        }
        return swapDolaForExactDbr(provider?.getSigner(), maxTokenIn, parseEther(dbrAmount), helperAddress);
    }

    const resetForm = () => {
        setDolaAmount('');
        setDbrAmount('');
        setInvAmount('');
    }

    useDualSpeedEffect(() => {
        setIsConnected(!!account);
    }, [account], !account, 1000, 0);

    useEffect(() => {
        if (isLoading) {
            return;
        }
        const bestPriceSrc = (classicAuctionPricingData?.dbrAuctionPriceInToken < sdolaAuctionPricingData?.dbrAuctionPriceInToken ? 'classic' : 'sdola');
        setBestAuctionSrc(bestPriceSrc);
        if (isInited) {
            return;
        }
        setDolaAuctionType(bestPriceSrc);
        setIsInited(true);
    }, [
        classicAuctionPricingData?.dbrAuctionPriceInToken,
        sdolaAuctionPricingData?.dbrAuctionPriceInToken,
        isLoading,
        isInited,
    ]);

    const arbitrageOpportunity = (isSellMode && !tokenAmount) || (dbrSwapPriceInToken < dbrAuctionPriceInToken) || (!isSellMode && !dbrAmount)
        ? 0 : getArbitrageValue(tokenAmount, dbrAuctionPriceInToken, dbrSwapPriceInToken, dbrPrice);

    return <Container
        label={title}
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
                        <NavButtons active={tab} options={TAB_OPTIONS} onClick={(v) => setTab(v)} />
                        {
                            tab === INFOS ?
                                <VStack w='full' alignItems="flex-start">
                                    <DbrAuctionParametersWrapper tokenPrice={sellTokenPrice} />
                                </VStack>
                                : <>
                                    <HStack w='full' justify="space-between">
                                        <Text fontSize="14px">
                                            DBR balance: <b>{preciseCommify(dbrBalance, 2)}</b>
                                        </Text>
                                        {
                                            tab === SELL_INV ?
                                                <Text fontSize="14px">
                                                    INV balance: <b>{preciseCommify(invBalance, 2)}</b>
                                                </Text> :
                                                <Text fontSize="14px">
                                                    DOLA balance: <b>{preciseCommify(dolaBalance, 2)}</b>
                                                </Text>
                                        }
                                    </HStack>
                                    {
                                        tab !== SELL_INV && <RadioCardGroup
                                            wrapperProps={{ w: 'full', pt: '2', alignItems: 'center', justify: { base: 'center', sm: 'space-between' } }}
                                            group={{
                                                name: 'auctionSel',
                                                value: dolaAuctionType,
                                                onChange: (v) => setDolaAuctionType(v),
                                            }}
                                            radioCardProps={{ fontSize: '15px', py: 3, px: '2', mr: '4', w: { base: 'full', sm: '100%' } }}
                                            options={[
                                                { value: 'classic', label: <AuctionRadioOption isBest={bestAuctionSrc === 'classic'} label="Virtual auction DBR price" dbrAuctionPriceInDola={classicAuctionPricingData.dbrAuctionPriceInToken} dolaPrice={dolaPrice} /> },
                                                { value: 'sdola', label: <AuctionRadioOption isBest={bestAuctionSrc === 'sdola'} label="sDOLA auction DBR price" dbrAuctionPriceInDola={sdolaAuctionPricingData.dbrAuctionPriceInToken} dolaPrice={dolaPrice} /> },
                                            ]}
                                        />
                                    }
                                    {
                                        tab === SELL_DOLA &&
                                        <VStack w='full' alignItems="flex-start">
                                            <TextInfo message="Amount of DOLA in exchange for DBR, the auction formula is of type K=xy">
                                                <Text fontWeight="bold" fontSize="16px">Amount DOLA to sell:</Text>
                                            </TextInfo>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
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
                                                isDisabled={isExactTokenBtnDisabled}
                                                checkBalanceOnTopOfIsDisabled={true}
                                                onSuccess={() => resetForm()}
                                            />
                                        </VStack>
                                    }
                                    {
                                        tab === SELL_INV &&
                                        <VStack w='full' alignItems="flex-start">
                                            <TextInfo message="Amount of INV in exchange for DBR, the auction formula is of type K=xy">
                                                <Text fontWeight="bold" fontSize="16px">Amount INV to sell:</Text>
                                            </TextInfo>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
                                                defaultAmount={dolaAmount}
                                                address={INV}
                                                destination={SINV_HELPER_ADDRESS}
                                                signer={provider?.getSigner()}
                                                decimals={18}
                                                onAction={() => sell()}
                                                actionLabel={`Sell INV for DBR`}
                                                onAmountChange={(v) => setInvAmount(v)}
                                                showMaxBtn={false}
                                                hideInputIfNoAllowance={false}
                                                showBalance={true}
                                                isDisabled={isExactTokenBtnDisabled}
                                                checkBalanceOnTopOfIsDisabled={true}
                                                onSuccess={() => resetForm()}
                                            />
                                        </VStack>
                                    }
                                    {
                                        tab === EXACT_DBR &&
                                        <VStack w='full' alignItems="flex-start">
                                            <TextInfo message="Exact amount of DBR in exchange for DOLA, the auction formula is of type K=xy">
                                                <Text fontWeight="bold" fontSize="14px">Exact amount of DBR to buy:</Text>
                                            </TextInfo>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
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
                                                checkBalanceOnTopOfIsDisabled={false}
                                                onSuccess={() => resetForm()}
                                            />
                                        </VStack>
                                    }
                                    {
                                        notEnoughToken && <InfoMessage alertProps={{ w: 'full' }} description={`Not enough ${sellTokenSymobl} balance`} />
                                    }
                                    <Divider />
                                    <ListLabelValues items={[
                                        (isSellMode ?
                                            { label: `Estimated amount to receive`, isLoading, value: estimatedDbrOut > 0 ? `${preciseCommify(estimatedDbrOut, 2)} DBR (${shortenNumber(estimatedDbrOut * dbrPrice, 2, true)})` : '-' }
                                            : { label: `Estimated amount to sell`, isLoading, value: estimatedTokenIn > 0 ? `${preciseCommify(estimatedTokenIn, 2)} ${sellTokenSymobl} (${shortenNumber(estimatedTokenIn * sellTokenPrice || 1, 2, true)})` : '-' }
                                        ),
                                        { label: `Price via selected auction`, color: auctionPriceColor, isLoading, value: dbrAuctionPriceInToken > 0 ? `~${shortenNumber(dbrAuctionPriceInToken, 4)} ${sellTokenSymobl} (${shortenNumber(dbrAuctionPriceInToken * sellTokenPrice, 4, true)})` : '-' },
                                        { label: `Market price${isExactInv ? '' : ' via Curve'}`, isLoading, value: !isCurvePriceLoading && dbrSwapPriceInToken > 0 ? `~${shortenNumber(dbrSwapPriceInToken, 4)} ${sellTokenSymobl} (${shortenNumber(dbrSwapPriceInToken * sellTokenPrice, 4, true)})` : '-' },
                                        estimatedTimeToReachMarketPrice <= 300 ? undefined : { label: `Est. time for the auction to reach the market price`, isLoading, value: estimatedTimeToReachMarketPrice > ONE_DAY_SECS ? `~${shortenNumber((estimatedTimeToReachMarketPrice / ONE_DAY_SECS), 2)} days` : `${moment(estimatedTimestampToReachMarketPrice).fromNow()}` },
                                        arbitrageOpportunity <= 0 ? undefined : { label: `Arbitrage opportunity`, isLoading, value: `${preciseCommify(arbitrageOpportunity, 2, true)}` },
                                    ]} />
                                    <Divider />
                                    <ListLabelValues items={[
                                        { label: `Max. slippage %`, value: auctionSlippageInput },
                                        (isSellMode ?
                                            { label: `Min. DBR to receive`, isLoading, value: minDbrOutNum > 0 ? `${preciseCommify(minDbrOutNum, 2, false, true)} DBR (${shortenNumber(minDbrOutNum * dbrPrice, 2, true)})` : '-' }
                                            :
                                            { label: `Max. ${sellTokenSymobl} to send`, isLoading, value: maxTokenInNum > 0 ? `${preciseCommify(maxTokenInNum, 2, false, true)} ${sellTokenSymobl} (${shortenNumber(maxTokenInNum * sellTokenPrice, 2, true)})` : '-' }
                                        ),
                                    ]} />
                                </>
                        }
                    </>
            }
        </VStack>
    </Container>
}