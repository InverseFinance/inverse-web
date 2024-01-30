import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { DBR_AUCTION_ADDRESS, DOLA_SAVINGS_ADDRESS, SDOLA_ADDRESS } from "@app/config/constants"
import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { useDBRPrice } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useDOLAPrice } from "@app/hooks/usePrices"
import { DbrAuctionType } from "@app/types"
import { getBnToNumber, shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const useDbrAuction = (isClassicDbrAuction: boolean): {
    dolaReserve: number;
    dbrReserve: number;
    dbrRatePerYear: number;
    maxDbrRatePerYear: number;
    K: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: apiData, error: apiErr } = useCustomSWR(`/api/auctions/dbr?isClassic=${isClassicDbrAuction}`);
    const { account } = useWeb3React();
    // reserves is an array
    const { data: reserves, error: reservesError } = useEtherSWR(
        isClassicDbrAuction ?
            [DBR_AUCTION_ADDRESS, 'getCurrentReserves']
            :
            [
                [SDOLA_ADDRESS, 'getDolaReserve'],
                [SDOLA_ADDRESS, 'getDbrReserve'],
            ]
    );
    const { data: otherData, error: otherDataError } = useEtherSWR(
        isClassicDbrAuction ? [
            [DBR_AUCTION_ADDRESS, 'dbrRatePerYear'],
            [DBR_AUCTION_ADDRESS, 'maxDbrRatePerYear'],
        ]
            : [
                [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget'],
                [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget'],
                [SDOLA_ADDRESS, 'getK'],
                [SDOLA_ADDRESS, 'targetK'],
                [SDOLA_ADDRESS, 'prevK'],
                [SDOLA_ADDRESS, 'lastKUpdate'],
            ]
    );

    const dolaReserve = reserves ? getBnToNumber(reserves[0]) : apiData?.dolaReserve || 0;
    const dbrReserve = reserves ? getBnToNumber(reserves[1]) : apiData?.dbrReserve || 0;

    return {
        dolaReserve,
        dbrReserve,
        dbrRatePerYear: otherData ? getBnToNumber(otherData[0]) : apiData?.yearlyRewardBudget || 0,
        maxDbrRatePerYear: otherData ? getBnToNumber(otherData[1]) : apiData?.maxYearlyRewardBudget || 0,
        K: reserves ? getBnToNumber(reserves[0].mul(reserves[1])) : apiData?.K || 0,
        isLoading: !account ? !apiData && !apiErr : (!reserves && !reservesError) || (!otherData && !otherDataError),
        hasError: !account ? apiErr : !!reservesError || !!otherDataError,
    }
}

export const DbrAuctionParametersWrapper = () => {
    const { priceUsd: dbrPrice } = useDBRPrice();
    const { price: dolaPrice } = useDOLAPrice();
    return <VStack w='full' alignItems="flex-start">
        <Text>General auction infos</Text>
        <DbrAuctionClassicParameters dbrPrice={dbrPrice} dolaPrice={dolaPrice} />
        <Text>sDOLA auction infos</Text>
        <DbrAuctionSDolaParameters dbrPrice={dbrPrice} dolaPrice={dolaPrice} />
    </VStack>
}

export const DbrAuctionSDolaParameters = ({ dbrPrice, dolaPrice }) => {
    const { dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction(false);
    return <DbrAuctionParameters
        dolaReserve={dolaReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        dolaPrice={dolaPrice}
    />
}

export const DbrAuctionClassicParameters = ({ dbrPrice, dolaPrice }) => {
    const { dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction(true);
    return <DbrAuctionParameters
        dolaReserve={dolaReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        dolaPrice={dolaPrice}
    />
}

export const DbrAuctionIntroMsg = () => {
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8', w: 'full' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What are XY=K Auctions?</Text>
                <Text>
                    XY=K auctions operate as a <b>virtual xy = k constant function market maker auction</b>, it allows users to buy DBR using DOLA. In the auction, the price of DBR (per DOLA) continuously reduces every second, until a DBR purchase is made at which point the price increases.
                </Text>
                <Text>
                    There is a "general" DBR auction and a "sDOLA" DBR auction, depending on usage and auction parameters, the cheapest DBR price will be one or the other. The proceeds from the general auction go to DOLA bad debt repayment while the proceeds from the sDOLA proceeds go to sDOLA stakers.
                </Text>
                <Link textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr#buying-dbr" target="_blank" isExternal>
                    Learn more <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is DBR?</Text>
                <VStack spacing="0" alignItems="flex-start">
                    <Text>
                        - DBR is the DOLA Borrowing Right token
                    </Text>
                    <Text>- One DBR allows you to borrow one DOLA for one year</Text>
                    <Text>- It's also the reward token for INV stakers on FiRM</Text>
                    <Text>- DBR can be bought to borrow or hedge against interest rates!</Text>
                </VStack>
                <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr' isExternal target="_blank">
                    Learn more about DBR <ExternalLinkIcon />
                </Link>
            </Stack>
        }
    />
}

export const DbrAuctionParameters = ({ dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading, dbrPrice, dolaPrice }) => {
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', w: 'full' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">Auction Current Reserves</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DOLA reserves:</Text>
                        {isLoading ? <TextLoader /> : dolaReserve < 1 ? <Text fontWeight="bold">{shortenNumber(dolaReserve, 2, false, true)}</Text> : <Text fontWeight="bold">{preciseCommify(dolaReserve, 0)} ({preciseCommify(dolaReserve * dolaPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR reserves:</Text>
                        {isLoading ? <TextLoader /> : dbrReserve < 1 ? <Text fontWeight="bold">{shortenNumber(dbrReserve, 2, false, true)}</Text> : <Text fontWeight="bold">{preciseCommify(dbrReserve, 0)} ({preciseCommify(dbrReserve * dbrPrice, 0, true)})</Text>}
                    </HStack>
                </VStack>
                <Text fontSize="14px" fontWeight="bold">Auction Contract Parameters</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrRatePerYear, 0)} ({preciseCommify(dbrRatePerYear * dbrPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- Max. DBR rate per year:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(maxDbrRatePerYear, 0)} ({preciseCommify(maxDbrRatePerYear * dbrPrice, 0, true)})</Text>}
                    </HStack>
                </VStack>
                {/* <Text fontSize="14px" fontWeight="bold">Governance</Text>
                <Text>Reserves and the max. DBR rate per year are updatable by Governance vote only. The DBR rate per year can be updated by Governance or by the Operator (within the max limit set by Governance).</Text>
                <Link textDecoration="underline" href="/governance" target="_blank" isExternal>
                    DBR Auction Governance proposal link <ExternalLinkIcon />
                </Link> */}
            </Stack>
        }
    />
}