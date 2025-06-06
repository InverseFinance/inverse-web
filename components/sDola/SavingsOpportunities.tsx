import { useAccount } from "@app/hooks/misc";
import { useDBRPrice } from "@app/hooks/useDBR";
import { useTokenBalances } from "@app/hooks/useToken";
import { useStakedDola } from "@app/util/dola-staking";
import { getToken, TOKENS } from "@app/variables/tokens";
import { HStack, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { DashBoardCard } from "../F2/UserDashboard";
import { InfoMessage } from "../common/Messages";
import { preciseCommify } from "@app/util/misc";
import { shortenNumber } from "@app/util/markets";
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useMemo, useState } from "react";
import Link from "../common/Link";
import { SDOLA_ADDRESS } from "@app/config/constants";
import { TOKEN_IMAGES } from "@app/variables/images";
import { MarketImage } from "../common/Assets/MarketImage";
import { EnsoModal } from "../common/Modal/EnsoModal";
import { useDOLAPrice } from "@app/hooks/usePrices";

const USDC = getToken(TOKENS, 'USDC');
const DAI = getToken(TOKENS, 'DAI');
const USDT = getToken(TOKENS, 'USDT');
const LUSD = { address: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', symbol: 'LUSD', image: TOKEN_IMAGES["LUSD"], decimals: 18 }
const USDP = { address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1', symbol: 'USDP', image: TOKEN_IMAGES["USDP"], decimals: 18 }
const USDE = { address: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3', symbol: 'USDe', image: TOKEN_IMAGES["USDE"], decimals: 18 }
const FDUSD = { address: '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409', symbol: 'FDUSD', image: TOKEN_IMAGES["FDUSD"], decimals: 18 }
const TUSD = { address: '0x0000000000085d4780b73119b644ae5ecd22b376', symbol: 'TUSD', image: TOKEN_IMAGES["TUSD"], decimals: 18 }
const GUSD = { address: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', symbol: 'GUSD', image: TOKEN_IMAGES["GUSD"], decimals: 2 }
const GHO = { address: '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f', symbol: 'GHO', image: TOKEN_IMAGES["GHO"], decimals: 18 }
const USD0 = { address: '0x73a15fed60bf67631dc6cd7bc5b6e8da8190acf5', symbol: 'USD0', image: TOKEN_IMAGES["USD0"], decimals: 18 }
const BUSD = { address: '0x4fabb145d64652a948d72533023f6e7a623c7c53', symbol: 'BUSD', image: TOKEN_IMAGES["BUSD"], decimals: 18 }
const ALUSD = { address: '0xbc6da0fe9ad5f3b0d58160288917aa56653660e9', symbol: 'ALUSD', image: TOKEN_IMAGES["ALUSD"], decimals: 18 }
const USDM = { address: '0x59d9356e565ab3a36dd77763fc0d87feaf85508c', symbol: 'USDM', image: TOKEN_IMAGES["USDM"], decimals: 18 }
const USDA = { address: '0x0000206329b97db379d5e1bf586bbdb969c63274', symbol: 'USDA', image: TOKEN_IMAGES["USDA"], decimals: 18 }
const MIM = { address: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3', symbol: 'MIM', image: TOKEN_IMAGES["MIM"], decimals: 18 }
const FXUSD = { address: '0x085780639cc2cacd35e474e71f4d000e2405d8f6', symbol: 'FXUSD', image: TOKEN_IMAGES["FXUSD"], decimals: 18 }
const USD3 = { address: '0x0d86883faf4ffd7aeb116390af37746f45b6f378', symbol: 'USD3', image: TOKEN_IMAGES["USD3"], decimals: 18 }
const EUSD = { address: '0xa0d69e286b938e21cbf7e51d71f6a4c8918f482f', symbol: 'EUSD', image: TOKEN_IMAGES["EUSD"], decimals: 18 }
const FEI = { address: '0x956f47f50a910163d8bf957cf5846d573e7f87ca', symbol: 'FEI', image: TOKEN_IMAGES["FEI"], decimals: 18 }
const MKUSD = { address: '0x4591dbff62656e7859afe5e45f6f47d3669fbb28', symbol: 'MKUSD', image: TOKEN_IMAGES["MKUSD"], decimals: 18 }
const PYUSD = getToken(TOKENS, 'PYUSD');
const CRVUSD = getToken(TOKENS, 'crvUSD');
const FRAX = getToken(TOKENS, 'FRAX');
const DOLA = getToken(TOKENS, 'DOLA');

const STABLE_LIST = [
    DOLA, DAI, USDT, LUSD, USDE, USDP, USDC, FRAX, CRVUSD, PYUSD, FEI, MIM, USD3, FXUSD, EUSD, MKUSD, GHO, USDM, USDA, USD0, BUSD, ALUSD, GUSD, TUSD, FDUSD
];
export const ETH_SAVINGS_STABLECOINS = STABLE_LIST.reduce((acc, curr) => {
    acc[curr.address] = curr;
    return acc;
}, {});
const STABLE_ADDRESSES = STABLE_LIST.map(t => t.address!);

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