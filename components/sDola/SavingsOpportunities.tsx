import { useAccount } from "@app/hooks/misc";
import { useDBRPrice } from "@app/hooks/useDBR";
import { useToken } from "@app/hooks/useToken";
import { useStakedDola } from "@app/util/dola-staking";
import { getToken, TOKENS } from "@app/variables/tokens";
import { HStack, Stack, Text, VStack } from "@chakra-ui/react"
import { DashBoardCard } from "../F2/UserDashboard";
import { InfoMessage } from "../common/Messages";
import { preciseCommify } from "@app/util/misc";
import { shortenNumber } from "@app/util/markets";
import { UnderlyingItemBlock } from "../common/Assets/UnderlyingItemBlock";
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useState } from "react";
import Link from "../common/Link";

const USDC = getToken(TOKENS, 'USDC');
const DAI = getToken(TOKENS, 'DAI');
const USDT = getToken(TOKENS, 'USDT');
const LUSD = getToken(TOKENS, 'LUSD');
const FRAX = getToken(TOKENS, 'FRAX');
const DOLA = getToken(TOKENS, 'DOLA');

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

export const SavingsOpportunities = () => {
    const account = useAccount();
    const [showTokens, setShowTokens] = useState(true);

    const { balance: dolaBalance } = useToken(DOLA.address, account);
    const { balance: usdcBalance } = useToken(USDC.address, account);
    const { balance: usdtBalance } = useToken(USDT.address, account);
    const { balance: daiBalance } = useToken(DAI.address, account);
    const { balance: lusdBalance } = useToken(LUSD.address, account);
    const { balance: fraxBalance } = useToken(FRAX.address, account);

    const balances = [
        { balance: dolaBalance, token: DOLA },
        { balance: usdcBalance, token: USDC },
        { balance: usdtBalance, token: USDT },
        { balance: daiBalance, token: DAI },
        { balance: lusdBalance, token: LUSD },
        { balance: fraxBalance, token: FRAX },
    ];

    const totalStables = balances.reduce((prev, curr) => prev + curr.balance, 0);

    const { priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy: currentApy } = useStakedDola(dbrDolaPrice);
    const { apy: apyAfterDeposit } = useStakedDola(dbrDolaPrice, totalStables);

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
                <EarningsProjections apy={apyAfterDeposit} total={totalStables} />
                <VStack alignItems="flex-start">
                    <Text fontWeight="bold" textDecoration="underline" cursor="pointer" onClick={() => setShowTokens(!showTokens)}>
                        Stables that you can put to work: {showTokens ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </Text>
                    {
                        showTokens && <>
                            <HStack w='300px' justify="space-between">
                                <Text w="33%" color="mainTextColorLight">Token</Text>
                                <Text w="33%" color="mainTextColorLight">Balance</Text>
                                <Text w="33%">&nbsp;</Text>
                            </HStack>
                            {
                                balances
                                    .filter(b => b.balance > 1)
                                    .map(b => {
                                        return <HStack key={b.token.address} w='300px' justify="space-between">
                                            <UnderlyingItemBlock {...b.token} label={b.token.symbol} w="33%"/>
                                            <Text w="33%">{shortenNumber(b.balance, 2)}</Text>
                                            {
                                                b.token.symbol !== 'DOLA' ? <Link w="33%" href={`https://swap.defillama.com/?chain=ethereum&from=${b.token.address}&tab=swap&to=${DOLA.address}`} textDecoration="underline">
                                                    Swap it <ExternalLinkIcon />
                                                </Link> : <Text w='33%'>&nbsp;</Text>
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