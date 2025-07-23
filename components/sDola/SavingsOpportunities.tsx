import { useDBRPrice } from "@app/hooks/useDBR";
import { useTokenBalances } from "@app/hooks/useToken";
import { useStakedDola } from "@app/util/dola-staking";
import { HStack, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { DashBoardCard } from "../F2/UserDashboard";
import { InfoMessage } from "../common/Messages";
import { preciseCommify } from "@app/util/misc";
import { shortenNumber } from "@app/util/markets";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useMemo, useState } from "react";
import { SDOLA_ADDRESS } from "@app/config/constants";
import { MarketImage } from "../common/Assets/MarketImage";
import { EnsoModal } from "../common/Modal/EnsoModal";
import { useDOLAPrice } from "@app/hooks/usePrices";
import { STABLE_ADDRESSES, STABLE_LIST } from "@app/variables/stables";

const EarningsProjections = ({ apy, total }: { apy: number, total: number }) => {
    const oneYearEarnings = apy / 100 * total;
    const thirtyDayEarnings = oneYearEarnings / 365 * 30;
    return <Stack direction={{ base: 'column', xl: 'row' }} w='full' justify="space-between">
        <VStack alignItems="flex-start">
            <Text color="mainTextColorLight">30-day projection</Text>
            <Text fontWeight="extrabold" fontSize="30px">+{shortenNumber(thirtyDayEarnings, 2, true)}</Text>
        </VStack>
        <VStack alignItems="flex-start">
            <Text color="mainTextColorLight">1-year projection</Text>
            <Text fontWeight="extrabold" fontSize="30px">+{shortenNumber(oneYearEarnings, 2, true)}</Text>
        </VStack>
        <VStack alignItems="flex-start">
            <Text color="mainTextColorLight">Resulting APY</Text>
            <Text fontWeight="extrabold" fontSize="30px">{shortenNumber(apy, 2)}%</Text>
        </VStack>
    </Stack>
}

export const useSavingsOpportunities = (account: string) => {
    const { balances, isLoading, isError } = useTokenBalances(STABLE_ADDRESSES, account);

    const tokenAndBalances = STABLE_LIST.map((token, i) => {
        return { balance: balances[i].balance, token };
    }).sort((a, b) => b.balance - a.balance);

    const totalStables = tokenAndBalances.reduce((prev, curr) => prev + curr.balance, 0);
    const useDolaAsMain = totalStables <= 10 || tokenAndBalances.some(t => t.token.symbol === 'DOLA' && t.balance > totalStables/5);

    return {
        isLoading,
        isError,
        tokenAndBalances,
        totalStables,
        topStable: tokenAndBalances?.length > 0 ? useDolaAsMain ? tokenAndBalances.find(t => t.token.symbol === 'DOLA') : tokenAndBalances[0] : null,
        // if DOLA is >= of the stable portfolio use as main entry point
        useDolaAsMain,
    }
}

export const SavingsOpportunities = ({ tokenAndBalances, totalStables }: { tokenAndBalances: { balance: number, token: any }[], totalStables: number }) => {
    const [showTokens, setShowTokens] = useState(true);
    const [defaultTokenIn, setDefaultTokenIn] = useState('');
    const { isOpen: isEnsoModalOpen, onOpen: onEnsoModalOpen, onClose: onEnsoModalClose } = useDisclosure();
    const { price: dolaPrice } = useDOLAPrice();

    const { priceDola: dbrDolaPrice, priceUsd: dbrPrice } = useDBRPrice();
    const { apy: currentApy, sDolaExRate } = useStakedDola(dbrPrice);
    const { apy: apyAfterDeposit } = useStakedDola(dbrPrice, totalStables);
    const sDOLAprice = dolaPrice * sDolaExRate;

    const _balances = useMemo(() => {
        return tokenAndBalances
            .filter(b => b.balance > 1)
    }, [tokenAndBalances]);

    if (totalStables < 10) {
        return null;
    }

    return <DashBoardCard p="6" bgColor="successAlpha" maxW="1075px">
        <VStack alignItems="flex-start" w='full'>
            <Text fontWeight="extrabold" fontSize="20px">
                Savings opportunity
            </Text>
            <VStack spacing="8" alignItems="flex-start" w='full'>
                <InfoMessage description={
                    <Text>You have <b>~{preciseCommify(totalStables, 2, true)}</b> worth of stablecoins in your wallet. Earn while staying stable with sDOLA!</Text>
                } />
                {
                    isEnsoModalOpen && <EnsoModal
                        isOpen={isEnsoModalOpen}
                        title={`Zap-In to sDOLA, powered by Enso Finance`}
                        introMessage={
                            <VStack w='full' alignItems='flex-start'>
                                <Text><b>Zap-In</b> lets you go from a token directly to sDOLA by combining a swap (if needed) and staking.</Text>
                            </VStack>
                        }
                        onClose={onEnsoModalClose}
                        defaultTokenIn={defaultTokenIn}
                        defaultTokenOut={SDOLA_ADDRESS}
                        defaultTargetChainId={1}
                        isSingleChoice={true}
                        targetAssetPrice={sDOLAprice}
                        ensoPoolsLike={[{ poolAddress: SDOLA_ADDRESS, chainId: 1 }]}
                    />
                }
                <EarningsProjections apy={apyAfterDeposit} total={totalStables} />
                <VStack alignItems="flex-start">
                    <Text fontWeight="bold" textDecoration="underline" cursor="pointer" onClick={() => setShowTokens(!showTokens)}>
                        Stables that you can put to work: {showTokens ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </Text>
                    {
                        showTokens && <>
                            <HStack w={{ base: '300px', md: '600px' }} justify="space-between">
                                <Text w={{ base: '29%', md: '20%' }} color="mainTextColorLight">Token</Text>
                                <Text w={{ base: '29%', md: '20%' }} color="mainTextColorLight">Balance</Text>
                                <Text w={{ base: '42%', md: '60%' }}>&nbsp;</Text>
                            </HStack>
                            {
                                _balances
                                    .map(b => {
                                        return <HStack key={b.token.address} w={{ base: '300px', md: '600px' }} justify="space-between">
                                            <HStack spacing="2" w={{ base: '29%', md: '20%' }}>
                                                <MarketImage image={b.token.image!} size={18} />
                                                <Text>{b.token.symbol}</Text>
                                            </HStack>
                                            <Text w={{ base: '29%', md: '20%' }}>{shortenNumber(b.balance, 2)}</Text>
                                            {
                                                b.token.symbol !== 'DOLA' ? <HStack spacing="4" justify="flex-start" w={{ base: '42%', md: '60%' }}>
                                                    <Text textDecoration="underline" onClick={
                                                        () => {
                                                            setDefaultTokenIn(b.token.address);
                                                            onEnsoModalOpen();
                                                        }
                                                    } cursor="pointer" color="accentTextColor">
                                                        Zap-in to sDOLA ⚡
                                                    </Text>
                                                    {/* <Link target="_blank" isExternal fontSize="14px" href={`https://swap.defillama.com/?chain=ethereum&from=${b.token.address}&tab=swap&to=${DOLA.address}`} textDecoration="underline">
                                                        Swap to DOLA <ExternalLinkIcon />
                                                    </Link>
                                                    <Link display={{ base: 'none', md: 'inline-block' }} target="_blank" isExternal fontSize="14px" href={`https://swap.defillama.com/?chain=ethereum&from=${b.token.address}&tab=swap&to=${SDOLA_ADDRESS}`} textDecoration="underline">
                                                        Swap to sDOLA <ExternalLinkIcon />
                                                    </Link> */}
                                                </HStack> : <Text w={{ base: '42%', md: '60%' }}>&nbsp;</Text>
                                            }
                                        </HStack>
                                    })
                            }
                        </>
                    }

                </VStack>
            </VStack>
        </VStack>
    </DashBoardCard>
}