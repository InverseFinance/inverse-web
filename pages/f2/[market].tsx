import { Breadcrumbs, SimmpleBreadcrumbs } from '@app/components/common/Breadcrumbs'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useAccountDBR, useAccountDBRMarket, useDBRMarkets } from '@app/hooks/useDBR'

import { Stack, VStack, Text, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { DbrHealth } from '@app/components/F2/DbrHealth'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import Container from '@app/components/common/Container'
import { InfoMessage } from '@app/components/common/Messages'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { commify, formatUnits, parseEther, parseUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { useAllowances } from '@app/hooks/useApprovals'
import { SubmitButton } from '@app/components/common/Button'
import { useBalances } from '@app/hooks/useBalances'
import { BalanceInput } from '@app/components/common/Input'
import { useState } from 'react'
import { f2borrow, f2deposit } from '@app/util/f2'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { BigNumber } from 'ethers'
import { roundFloorString } from '@app/util/misc'
import { CreditLimitBar } from '@app/components/F2/CreditLimitBar'

const { F2_MARKETS, DOLA } = getNetworkConfigConstants();
const dbrPrice = 0.021;

// urls can be /governance/proposals/<numProposal> or /governance/proposals/<era>/<proposalId>
export const F2MarketPage = ({ market }: { market: string }) => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { markets } = useDBRMarkets(market);
    const f2market = markets[0];
    const colDecimals = f2market.underlying.decimals;
    const { balance: dbrBalance, debt } = useAccountDBR(account);
    const { escrow, deposits, creditLimit, withdrawalLimit } = useAccountDBRMarket(f2market, account);

    const { balances } = useBalances([f2market.collateral]);
    const { balances: marketBnBalances } = useBalances([DOLA], 'balanceOf', f2market.address);
    const { balances: dolaBalances } = useBalances([DOLA], 'balanceOf');
    const dolaBalance = dolaBalances ? getBnToNumber(dolaBalances[DOLA]) : 0;

    const bnMarketDolaLiquidity = marketBnBalances ? marketBnBalances[DOLA] : BigNumber.from('0');
    const marketDolaLiquidity = marketBnBalances ? getBnToNumber(marketBnBalances[DOLA]) : 0;

    const collateralBalance = balances ? getBnToNumber(balances[f2market.collateral], colDecimals) : 0;
    // const maxNewBorrow = deposits ? deposits * f2market.collateralFactor/100 * f2market.price : 0;

    const creditLeft = withdrawalLimit * f2market?.price * f2market.collateralFactor / 100;
    const bnMaxNewBorrow = parseEther(roundFloorString(creditLeft || 0));

    const handleDeposit = (amount: BigNumber) => {
        return f2deposit(library?.getSigner(), market, amount)
    }

    const handleBorrow = (amount: BigNumber) => {
        return f2borrow(library?.getSigner(), market, amount)
    }

    return (
        <Layout>
            <AppNav active="Frontier" />
            <ErrorBoundary>
                <VStack w='full' maxW="84rem" alignItems="flex-start" p="6" spacing="8">
                    <SimmpleBreadcrumbs
                        breadcrumbs={[
                            { label: 'F2', href: '/f2' },
                            { label: `${f2market.name} Market`, href: '#' },
                        ]}
                    />
                    <Stack
                        alignItems="flex-start"
                        w='full'
                        direction={{ base: 'column', lg: 'row' }}
                        spacing="12"
                    >
                        <ErrorBoundary description="Failed to load Dbr Health"><CreditLimitBar account={account} market={f2market} /></ErrorBoundary>
                        <ErrorBoundary description="Failed to load Dbr Health"><DbrHealth /></ErrorBoundary>
                    </Stack>
                    <Stack
                        alignItems="flex-start"
                        w='full'
                        direction={{ base: 'column', lg: 'row' }}
                        spacing="12"
                    >
                        <Container
                            noPadding
                            p="0"
                            label="Deposit Collateral"
                            description="To be able to Borrow"
                            w={{ base: 'full', lg: '50%' }}
                        >
                            <VStack justifyContent='space-between' w='full' minH="270px">
                                <VStack alignItems='flex-start' w='full'>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Collateral Name:</Text>
                                        <Text><UnderlyingItemBlock symbol={f2market?.underlying.symbol} /></Text>
                                    </HStack>

                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Oracle Price:</Text>
                                        <Text>${commify(f2market.price.toFixed(2))}</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Your Balance:</Text>
                                        <Text>{shortenNumber(collateralBalance, 2)} ({shortenNumber(collateralBalance * f2market.price, 2, true)})</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Your Deposits:</Text>
                                        <Text>{shortenNumber(deposits, 2)} ({shortenNumber(deposits * f2market.price, 2, true)})</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Collateral Factor:</Text>
                                        <Text>{f2market.collateralFactor}%</Text>
                                    </HStack>
                                </VStack>
                                <SimpleAmountForm
                                    address={f2market.collateral}
                                    destination={f2market.address}
                                    signer={library?.getSigner()}
                                    decimals={colDecimals}
                                    onAction={({ bnAmount }) => handleDeposit(bnAmount)}
                                    onMaxAction={({ bnAmount }) => handleDeposit(bnAmount)}
                                    actionLabel="Deposit"
                                    maxActionLabel="Deposit MAX"
                                />
                            </VStack>
                        </Container>
                        <Container
                            noPadding
                            p="0"
                            label="Borrow DOLA stablecoin"
                            description="Against your deposited collateral"
                            w={{ base: 'full', lg: '50%' }}
                        >
                            <VStack justifyContent='space-between' w='full' minH="270px">
                                <VStack alignItems='flex-start' w='full'>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Borrow Asset:</Text>
                                        <Text><UnderlyingItemBlock symbol={'DOLA'} /></Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Market Price:</Text>
                                        <Text>$1</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Your DOLA Balance:</Text>
                                        <Text>{shortenNumber(dolaBalance, 2)}</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Available DOLA liquidity:</Text>
                                        <Text>{shortenNumber(marketDolaLiquidity, 2)}</Text>
                                    </HStack>
                                    <HStack w='full' justifyContent="space-between">
                                        <Text>Your DOLA Borrow Rights:</Text>
                                        <Text>{shortenNumber(dbrBalance, 2)}</Text>
                                    </HStack>
                                </VStack>
                                <SimpleAmountForm
                                    address={f2market.collateral}
                                    destination={f2market.address}
                                    signer={library?.getSigner()}
                                    decimals={colDecimals}
                                    isDisabled={false}
                                    maxAmountFrom={[bnMarketDolaLiquidity, bnMaxNewBorrow]}
                                    onAction={({ bnAmount }) => handleBorrow(bnAmount)}
                                    onMaxAction={({ bnAmount }) => handleBorrow(bnAmount)}
                                    actionLabel="Borrow"
                                    maxActionLabel="Borrow MAX"
                                />
                                {/* <InfoMessage
                                    alertProps={{ w: 'full' }}
                                    description={
                                        <Text>
                                            Your DBR balance will decrease by  every day
                                        </Text>
                                    }
                                /> */}
                            </VStack>
                        </Container>
                    </Stack>
                    <Stack
                        alignItems="flex-start"
                        w='full'
                        direction={{ base: 'column', lg: 'row' }}
                        spacing="12"
                    >
                        {/* <Container
                            noPadding
                            p="0"
                            label="What is the DBR Token"
                            description="And how to lock-in a Fixed Borrow Rate"
                            w={{ base: 'full', lg: '100%' }}
                        >
                            <VStack alignItems='flex-start' w='full'>
                                <InfoMessage
                                    alertProps={{
                                        fontSize: '12px',
                                    }}
                                    title="What is the DBR token?"
                                    description={
                                        <VStack alignItems="flex-start">
                                            <Text>One <b>DOLA Borrow Rights</b> Token (DBR) gives the right to borrow one DOLA for one year.</Text>
                                            <Text fontWeight="bold">Example:</Text>
                                            <Text>Buying 1,000 DBR at $0.01 is equivalent to getting the rights to borrow 1,000 DOLA for one year with a Fixed Rate of 1% (or 2,000 DOLA at 2%).</Text>
                                        </VStack>
                                    }
                                />
                                <HStack w='full' justifyContent="space-between">
                                    <Text>Current DBR Price:</Text>
                                    <Text>${commify(dbrPrice.toFixed(2))}</Text>
                                </HStack>
                                <HStack w='full' justifyContent="space-between">
                                    <Text>Current Fixed Rate:</Text>
                                    <Text>{shortenNumber(dbrPrice * 100, 2)}%</Text>
                                </HStack>
                                <SubmitButton>
                                    Get DBR to lock-in a Rate
                                </SubmitButton>
                            </VStack>
                        </Container> */}
                        {/* <Container
                            noPadding
                            p="0"
                            label="Lock-in a Borrow Rate"
                            description="What is the DOLA Borrow Rights token?"
                            w={{ base: 'full', lg: '50%' }}
                        >
                            <VStack alignItems='flex-start' w='full'>
                                <InfoMessage
                                    alertProps={{
                                        fontSize: '12px',
                                    }}
                                    title="What is the DBR token?"
                                    description={
                                        <VStack alignItems="flex-start">
                                            <Text>One <b>DOLA Borrow Rights</b> Token (DBR) gives the right to borrow one DOLA for one year.</Text>
                                            <Text fontWeight="bold">Example:</Text>
                                            <Text>Buying 1,000 DBR at $0.01 is equivalent to getting the rights to borrow 1,000 DOLA for one year with a Fixed Rate of 1% (or 2,000 DOLA at 2%).</Text>
                                        </VStack>
                                    }
                                />
                                <HStack w='full' justifyContent="space-between">
                                    <Text>Current DBR Price:</Text>
                                    <Text>${commify(dbrPrice.toFixed(2))}</Text>
                                </HStack>
                                <HStack w='full' justifyContent="space-between">
                                    <Text>Current Fixed Rate:</Text>
                                    <Text>{shortenNumber(dbrPrice * 100, 2)}%</Text>
                                </HStack>
                                <SubmitButton>
                                    Get DBR to lock-in a Rate
                                </SubmitButton>
                            </VStack>
                        </Container> */}
                    </Stack>
                </VStack>

            </ErrorBoundary>
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market: market },
    }
}

export async function getStaticPaths() {
    return {
        paths: F2_MARKETS.map(m => `/f2/${m.address}`),
        fallback: true,
    }
}
