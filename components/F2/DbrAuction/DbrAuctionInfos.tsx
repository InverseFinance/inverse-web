import Link from "@app/components/common/Link"
import { InfoMessage } from "@app/components/common/Messages"
import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { useDBRPrice } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useDOLAPrice } from "@app/hooks/usePrices"
import { DbrAuctionType } from "@app/types"
import { DBR_AUCTION_ADDRESS } from "@app/util/dbr-auction"
import { DOLA_SAVINGS_ADDRESS, SDOLA_ADDRESS } from "@app/util/dola-staking"
import { getBnToNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { HStack, SkeletonText, Stack, Text, VStack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"

const TextLoader = () => <SkeletonText pt="2" skeletonHeight={2} noOfLines={1} height={'24px'} width={'90px'} />;

export const useDbrAuction = (): {
    dolaReserve: number;
    dbrReserve: number;
    dbrRatePerYear: number;
    maxDbrRatePerYear: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: apiData, error: apiErr } = useCustomSWR('/api/auctions/dbr');
    const { account } = useWeb3React();
    const { data: reserves, error } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'getCurrentReserves']
    );
    const { data: dbrRate, error: dbrRateError } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'dbrRatePerYear']
    );
    const { data: maxDbrRate, error: maxDbrRateError } = useEtherSWR(
        [DBR_AUCTION_ADDRESS, 'maxDbrRatePerYear']
    );
    return {
        dolaReserve: reserves ? getBnToNumber(reserves[0]) : apiData?.dolaReserve || 0,
        dbrReserve: reserves ? getBnToNumber(reserves[1]) : apiData?.dbrReserve || 0,
        dbrRatePerYear: reserves ? getBnToNumber(dbrRate) : apiData?.yearlyRewardBudget || 0,
        maxDbrRatePerYear: reserves ? getBnToNumber(maxDbrRate) : apiData?.maxYearlyRewardBudget || 0,
        isLoading: !account ? !apiData && !apiErr : (!reserves && !error) || (!dbrRate && !dbrRateError) || (!maxDbrRate && !maxDbrRateError),
        hasError: !account ? apiErr : !!error || !!dbrRateError || !!maxDbrRateError,
    }
}

const useDolaSavingsAuction = (): {
    dolaReserve: number;
    dbrReserve: number;
    dbrRatePerYear: number;
    maxDbrRatePerYear: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: reserves, error } = useEtherSWR([
        [SDOLA_ADDRESS, 'getDolaReserve'],
        [SDOLA_ADDRESS, 'getDbrReserve'],
    ]);
    const { data: dbrRate, error: dbrRateError } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget']
    );
    const { data: maxDbrRate, error: maxDbrRateError } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget']
    );
    return {
        dolaReserve: reserves ? getBnToNumber(reserves[0]) : 0,
        dbrReserve: reserves ? getBnToNumber(reserves[1]) : 0,
        dbrRatePerYear: reserves ? getBnToNumber(dbrRate) : 0,
        maxDbrRatePerYear: reserves ? getBnToNumber(maxDbrRate) : 0,
        isLoading: (!reserves && !error) || (!dbrRate && !dbrRateError) || (!maxDbrRate && !maxDbrRateError),
        hasError: !!error || !!dbrRateError || !!maxDbrRateError,
    }
}

export const DbrAuctionInfos = ({ type }: { type: DbrAuctionType }) => {
    const { priceUsd: dbrPrice } = useDBRPrice();
    const { price: dolaPrice } = useDOLAPrice();
    if (type === 'classic') {
        return <DbrAuctionInfosClassic dbrPrice={dbrPrice} dolaPrice={dolaPrice} />
    }
    return <DbrAuctionInfosSDola dbrPrice={dbrPrice} dolaPrice={dolaPrice} />
}

export const DbrAuctionInfosSDola = ({ dbrPrice, dolaPrice }) => {
    const { dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDolaSavingsAuction();
    return <DbrAuctionInfosMsg
        dolaReserve={dolaReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        dolaPrice={dolaPrice}
    />
}

export const DbrAuctionInfosClassic = ({ dbrPrice, dolaPrice }) => {
    const { dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading } = useDbrAuction();
    return <DbrAuctionInfosMsg
        dolaReserve={dolaReserve}
        dbrReserve={dbrReserve}
        dbrRatePerYear={dbrRatePerYear}
        maxDbrRatePerYear={maxDbrRatePerYear}
        isLoading={isLoading}
        dbrPrice={dbrPrice}
        dolaPrice={dolaPrice}
    />
}

export const DbrAuctionInfosMsg = ({ dolaReserve, dbrReserve, dbrRatePerYear, maxDbrRatePerYear, isLoading, dbrPrice, dolaPrice }) => {
    return <InfoMessage
        showIcon={false}
        alertProps={{ fontSize: '12px', mb: '8' }}
        description={
            <Stack>
                <Text fontSize="14px" fontWeight="bold">What are XY=K Auctions?</Text>
                <Text>
                    XY=K auctions operate as a virtual xy = k constant function market maker auction, it allows users to buy DBR using DOLA. In the auction, the price of DBR (per DOLA) continuously reduces every second, until a DBR purchase is made at which point the price increases.
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
                <Text fontSize="14px" fontWeight="bold">Auction Current Reserves</Text>
                <VStack w='full' spacing="0">
                    <HStack w='full'>
                        <Text>- DOLA reserves:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dolaReserve, 0)} ({preciseCommify(dolaReserve * dolaPrice, 0, true)})</Text>}
                    </HStack>
                    <HStack w='full'>
                        <Text>- DBR reserves:</Text>
                        {isLoading ? <TextLoader /> : <Text fontWeight="bold">{preciseCommify(dbrReserve, 0)} ({preciseCommify(dbrReserve * dbrPrice, 0, true)})</Text>}
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