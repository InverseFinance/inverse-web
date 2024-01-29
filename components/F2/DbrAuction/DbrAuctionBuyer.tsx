import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { estimateAuctionTimeToReachMarketPrice, swapDolaForExactDbr, swapExactDolaForDbr, useDbrAuctionPricing } from "@app/util/dbr-auction"
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
import { DbrAuctionParametersWrapper, useDbrAuction } from "./DbrAuctionInfos";
import moment from "moment";
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, DOLA_SAVINGS_ADDRESS, ONE_DAY_SECS, SDOLA_HELPER_ADDRESS } from "@app/config/constants";
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect";
import { RadioCardGroup } from "@app/components/common/Input/RadioCardGroup";
import { DbrAuctionType } from "@app/types";

const { DOLA } = getNetworkConfigConstants();

const defaultRefClassicAmount = '1';
const defaultRefSdolaAmount = '0.5';

const TAB_OPTIONS = ['Sell DOLA', 'Buy DBR', 'Infos'];

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

const AuctionRadioOption = ({ label, dbrAuctionPriceInDola, dolaPrice }) => {
    return <VStack>
        <Text>{label}</Text>
        <Text>{shortenNumber(dbrAuctionPriceInDola, 4)} ({shortenNumber(dolaPrice * dbrAuctionPriceInDola, 2, true)})</Text>
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
}

export const DbrAuctionBuyer = ({    
    title,
}) => {
    const { price: dolaPrice } = useDOLAPriceLive();
    const { provider, account } = useWeb3React();
    const [dolaAmount, setDolaAmount] = useState('');
    const [dbrAmount, setDbrAmount] = useState('');
    const [selectedAuction, setSelectedAuction] = useState<DbrAuctionType>('classic');    
    const [isConnected, setIsConnected] = useState(true);
    const { signedBalance: dbrBalance, dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    const { balance: dolaBalance } = useDOLABalance(account);

    const [slippage, setSlippage] = useState('1');
    const [tab, setTab] = useState(TAB_OPTIONS[0]);
    const isExactDola = tab === TAB_OPTIONS[0];
    const isClassicDbrAuction = selectedAuction === 'classic';
    const helperAddress = AUCTION_TYPES[selectedAuction].helper;
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;

    const { price: dbrSwapPriceRef } = useTriCryptoSwap(parseFloat(defaultRefAmount), 0, 1);
    const { price: dbrSwapPrice, isLoading: isCurvePriceLoading } = useTriCryptoSwap(parseFloat(!dolaAmount || dolaAmount === '0' ? defaultRefAmount : dolaAmount), 0, 1);

    const dbrSwapPriceInDola = dbrSwapPrice ? 1 / dbrSwapPrice : 0;
    const dbrSwapPriceRefInDola = dbrSwapPriceRef ? 1 / dbrSwapPriceRef : 0;

    const classicAuctionPricingData = useDbrAuctionPricing({ helperAddress: DBR_AUCTION_HELPER_ADDRESS, dolaAmount, dbrAmount, slippage, isExactDola, dbrSwapPriceRefInDola });
    const sdolaAuctionPricingData = useDbrAuctionPricing({ helperAddress: SDOLA_HELPER_ADDRESS, dolaAmount, dbrAmount, slippage, isExactDola, dbrSwapPriceRefInDola });
    const selectedAuctionData = (isClassicDbrAuction ? classicAuctionPricingData : sdolaAuctionPricingData);
    const {
        estimatedTimestampToReachMarketPrice,
        estimatedTimeToReachMarketPrice,
        dbrAuctionPriceInDola,
        minDbrOut,
        maxDolaIn,
        minDbrOutNum,
        maxDolaInNum,
        estimatedDolaIn,
        estimatedDbrOut,
    } = selectedAuctionData;

    const isLoading = isCurvePriceLoading || (!selectedAuctionData);

    const { priceUsd: dbrPrice } = useDBRPrice();

    const auctionPriceColor = !dbrSwapPriceInDola || !dbrAuctionPriceInDola ? undefined : dbrAuctionPriceInDola >= dbrSwapPriceInDola ? 'success' : 'warning';

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
                            tab === TAB_OPTIONS[2] ?
                                <VStack w='full' alignItems="flex-start">
                                    <DbrAuctionParametersWrapper />
                                </VStack>
                                : <>
                                    <HStack w='full' justify="space-between">
                                        <Text fontSize="14px">
                                            DBR balance: {preciseCommify(dbrBalance, 2)}
                                        </Text>
                                        <Text fontSize="14px">
                                            DOLA balance: {preciseCommify(dolaBalance, 2)}
                                        </Text>
                                    </HStack>
                                    <RadioCardGroup
                                        wrapperProps={{ w: 'full', alignItems: 'center', justify: { base: 'center', sm: 'left' } }}
                                        group={{
                                            name: 'auctionSel',
                                            value: selectedAuction,
                                            onChange: (v) => setSelectedAuction(v),
                                        }}
                                        radioCardProps={{ py: 0, px: '2', mr: '4', w: { base: 'full', sm: '150px' } }}
                                        options={[
                                            { value: 'classic', label: <AuctionRadioOption label="General auction price" dbrAuctionPriceInDola={classicAuctionPricingData.dbrAuctionPriceInDola} dolaPrice={dolaPrice} /> },
                                            { value: 'sdola', label: <AuctionRadioOption label="sDOLA auction price" dbrAuctionPriceInDola={sdolaAuctionPricingData.dbrAuctionPriceInDola} dolaPrice={dolaPrice} /> },
                                        ]}
                                    />
                                    {
                                        tab === TAB_OPTIONS[0] &&
                                        <VStack w='full' alignItems="flex-start">
                                            <TextInfo message="Exact amount of DOLA in exchange for DBR, the auction formula is of type K=xy">
                                                <Text fontWeight="bold" fontSize="14px">Exact amount DOLA to sell:</Text>
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
                                                isDisabled={isExactDolaBtnDisabled}
                                                checkBalanceOnTopOfIsDisabled={true}
                                                onSuccess={() => resetForm()}
                                            />
                                        </VStack>
                                    }
                                    {
                                        tab === TAB_OPTIONS[1] &&
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
                                        { label: `Price via auction`, color: auctionPriceColor, isLoading, value: dbrAuctionPriceInDola > 0 ? `~${shortenNumber(dbrAuctionPriceInDola, 4)} DOLA (${shortenNumber(dbrAuctionPriceInDola * dolaPrice, 4, true)})` : '-' },
                                        { label: `Market price via Curve`, isLoading, value: !isCurvePriceLoading && dbrSwapPriceInDola > 0 ? `~${shortenNumber(dbrSwapPriceInDola, 4)} DOLA (${shortenNumber(dbrSwapPriceInDola * dolaPrice, 4, true)})` : '-' },
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
                    </>
            }
        </VStack>
    </Container>
}