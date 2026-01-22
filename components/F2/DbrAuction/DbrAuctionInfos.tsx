import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { DBR_AUCTION_ADDRESS, DBR_DISTRIBUTOR_ADDRESS, DOLA_SAVINGS_ADDRESS, JDOLA_AUCTION_ADDRESS, ONE_DAY_SECS, SDOLA_ADDRESS, SINV_ADDRESS } from "@app/config/constants"
import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { useDBRPrice } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useDOLAPrice } from "@app/hooks/usePrices"
import { DbrAuctionType } from "@app/types"
import { getBnToNumber, shortenNumber, smartShortNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const useDbrAuction = (auctionType: 'classic' | 'sdola' | 'sinv' | 'jdola'): {
    tokenReserve: number;
    dbrReserve: number;
    dbrRatePerYear: number;
    maxDbrRatePerYear: number;
    K: number;
    historicalRates: { timestamp: number, rate: number, block: number }[];
    isLoading: boolean;
    hasError: boolean;
} => {
    const { account } = useWeb3React();
    const { data: apiData, error: apiError } = useCustomSWR(`/api/auctions/dbr`);
    
    const isClassicDbrAuction = auctionType === 'classic';
    const isSdolaAuction = auctionType === 'sdola';
    const isSinvAuction = auctionType === 'sinv';
    const isJDolaAuction = auctionType === 'jdola';
    const isVirtualDbr = isJDolaAuction || isClassicDbrAuction;
    // reserves is an array    
    const { data: reserves, error: reservesError } = useEtherSWR(
        isVirtualDbr ?
        isClassicDbrAuction ? [DBR_AUCTION_ADDRESS, 'getCurrentReserves'] : [JDOLA_AUCTION_ADDRESS, 'getReserves']
            :
            isSdolaAuction ?
                {
                    abi: [
                        'function getDolaReserve() public view returns (uint)',
                        'function getDbrReserve() public view returns (uint)',
                    ],
                    args: [
                        [SDOLA_ADDRESS, 'getDolaReserve'],
                        [SDOLA_ADDRESS, 'getDbrReserve'],
                    ],
                }
                :
                {
                    abi: [
                        'function getInvReserve() public view returns (uint)',
                        'function getDbrReserve() public view returns (uint)',
                    ],
                    args: [
                        [SINV_ADDRESS, 'getInvReserve'],
                        [SINV_ADDRESS, 'getDbrReserve'],
                    ],
                },
    );
    const { data: otherData, error: otherDataError } = useEtherSWR(
        isClassicDbrAuction ? [
            [DBR_AUCTION_ADDRESS, 'dbrRatePerYear'],
            [DBR_AUCTION_ADDRESS, 'maxDbrRatePerYear'],
        ]
            : isSdolaAuction || isJDolaAuction ? [
                [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget'],
                [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget'],
            ] :
                [
                    [DBR_DISTRIBUTOR_ADDRESS, 'rewardRate'],
                    [DBR_DISTRIBUTOR_ADDRESS, 'maxRewardRate'],
                ]
    );

    const tokenReserve = reserves ? getBnToNumber(reserves[0]) : 0;
    const dbrReserve = reserves ? getBnToNumber(reserves[1]) : 0;
    const rateMultiplier = isSinvAuction ? ONE_DAY_SECS * 365 : 1;

    return {
        historicalRates: apiData?.historicalRates || [],
        tokenReserve,
        dbrReserve,
        dbrRatePerYear: otherData ? getBnToNumber(otherData[0]) * rateMultiplier : isClassicDbrAuction ? apiData?.yearlyRewardBudget || 0 : 0,
        maxDbrRatePerYear: otherData ? getBnToNumber(otherData[1]) * rateMultiplier : isClassicDbrAuction ? apiData?.maxYearlyRewardBudget || 0 : 0,
        K: reserves ? getBnToNumber(reserves[0].mul(reserves[1])) : 0,
        isLoading: !account ? !apiData && !apiError : (!reserves && !reservesError) || (!otherData && !otherDataError),
        hasError: !account ? !apiData && !apiError : !!reservesError || !!otherDataError,
    }
}

export const DbrAuctionParametersWrapper = ({ dolaPrice, invPrice }: { dolaPrice: number, invPrice: number }) => {
    const { priceUsd: dbrPrice } = useDBRPrice(); 
    return <VStack w='full' alignItems="flex-start">
        <Text fontWeight="bold">jrDOLA auction infos:</Text>
        <DbrAuctionClassicParameters dbrPrice={dbrPrice} tokenPrice={dolaPrice} />
        <Text fontWeight="bold">Virtual auction infos:</Text>
        <DbrAuctionClassicParameters dbrPrice={dbrPrice} tokenPrice={dolaPrice} />
        <Text fontWeight="bold">sDOLA auction infos:</Text>
        <DbrAuctionSDolaParameters dbrPrice={dbrPrice} tokenPrice={dolaPrice} />
        <Text fontWeight="bold">sINV auction infos:</Text>
        <DbrAuctionSinvParameters dbrPrice={dbrPrice} tokenPrice={invPrice} />
    </VStack>
}

export const DbrAuctionSDolaParameters = ({ dbrPrice, tokenPrice }) => {
    const { tokenReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction('sdola');
    return <DbrAuctionParameters
        tokenSymbol='DOLA'
        tokenReserve={tokenReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        tokenPrice={tokenPrice}
    />
}

export const DbrAuctionJDolaParameters = ({ dbrPrice, tokenPrice }) => {
    const { tokenReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction('jdola');
    return <DbrAuctionParameters
        tokenSymbol='DOLA'
        tokenReserve={tokenReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        tokenPrice={tokenPrice}
    />
}


export const DbrAuctionClassicParameters = ({ dbrPrice, tokenPrice }) => {
    const { tokenReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction('classic');
    return <DbrAuctionParameters
        tokenSymbol='DOLA'
        tokenReserve={tokenReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        tokenPrice={tokenPrice}
    />
}

export const DbrAuctionSinvParameters = ({ dbrPrice, tokenPrice }) => {
    const { tokenReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction('sinv');
    return <DbrAuctionParameters
        tokenSymbol='INV'
        tokenReserve={tokenReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        tokenPrice={tokenPrice}
    />
}

export const DbrAuctionIntroMsg = ({
    dbrSaleHandlerRepayPercentage,
}: {
    dbrSaleHandlerRepayPercentage: number
}) => {
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8', w: 'full' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What are XY=K Auctions?</Text>
                <Text>
                    XY=K auctions operate as a <b>virtual xy = k constant function market maker auction</b>, it allows users to buy DBR using DOLA or INV. In the auction, the price of DBR continuously reduces every second, until a DBR purchase is made at which point the price increases.
                </Text>
                <Text>
                    All the auctions offer different DBR pricing depending on usage and auction parameters. {smartShortNumber(dbrSaleHandlerRepayPercentage, 2)}% of the proceeds from the Virtual auction go to DOLA bad debt repayment while the proceeds from the sDOLA proceeds go to sDOLA stakers and the proceeds from the sINV auction go to INV stakers.
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
                <Text fontSize="14px" fontWeight="bold">Looking for sDOLA or sINV?</Text>
                <VStack alignItems="flex-start" spacing="0">
                    <Link textDecoration="underline" href='/sDOLA'>
                        Go to the DOLA staking page
                    </Link>
                    <Link textDecoration="underline" href='/sINV'>
                        Go to the INV staking page
                    </Link>
                </VStack>
            </Stack>
        }
    />
}

export const DbrAuctionParameters = ({ tokenSymbol, tokenReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading, dbrPrice, tokenPrice }) => {
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', w: 'full' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">Auction Current Reserves</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- {tokenSymbol} reserves:</Text>
                        {isLoading ? <TextLoader /> : tokenReserve < 1 ? <Text fontWeight="bold">{shortenNumber(tokenReserve, 2, false, true)}</Text> : <Text fontWeight="bold">{preciseCommify(tokenReserve, 0)} ({preciseCommify(tokenReserve * tokenPrice, 0, true)})</Text>}
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
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{!dbrRatePerYear ? '-' : `${preciseCommify(dbrRatePerYear, 0)} (${preciseCommify(dbrRatePerYear * dbrPrice, 0, true)})`}</Text>}
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