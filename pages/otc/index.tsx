import { Stack, HStack, Image, VStack, Text, useInterval } from '@chakra-ui/react'
import Head from 'next/head';
import Layout from '@app/components/common/Layout';
import { AppNav } from '@app/components/common/Navbar';
import { BigNumber, Contract } from 'ethers';
import { BURN_ADDRESS, SINV_ADDRESS } from '@app/config/constants';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets';
import { usePrices } from '@app/hooks/usePrices';

import Container from '@app/components/common/Container';
import { preciseCommify } from '@app/util/misc';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { JsonRpcSigner } from '@ethersproject/providers';
import { useAccount } from '@app/hooks/misc';
import ScannerLink from '@app/components/common/ScannerLink';
import { InfoMessage, SuccessMessage, WarningMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { formatDateWithTime, fromNow } from '@app/util/time';
import { useTokenBalanceAndAllowance } from '@app/hooks/useToken';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';
import { ApproveButton } from '@app/components/Anchor/AnchorButton';
import { SINV_ABI } from '@app/config/abis';

const DOLA = '0x865377367054516e17014CcdED1e7d814EDC9ce4';
const PRICE = 25;

const OTC_ABI = [
    "function buy(uint256 minLsInvAmountOut) external returns (uint256 lsInvOut)",
    "function redeem(uint256 lsInvAmount) external",
    "function dolaAllocations(address buyer) public view returns (uint256)",
    "function INV_PRICE() public view returns (uint256)",
    "function buyDeadline() public view returns (uint256)",
    "function redemptionTimestamp() public view returns (uint256)",
]

const OTC_ADDRESS = '0x21F9049121F81aD1959938DC2e1c202412ac6766';

const buyers = [
    '0xFa4FC4ec2F81A4897743C5b4f45907c02ce06199',
    '0x0591926d5d3b9Cc48ae6eFB8Db68025ddc3adFA5',
    '0xB4fb31E7B1471A8e52dD1e962A281a732EaD59c1',
    '0xa53A13A80D72A855481DE5211E7654fAbDFE3526',
    '0x5bAaC7ccda079839C9524b90dF81720834FC039f',
    '0x1883c69cE441f0294097af5abFC53b3C7Fe36808',
]

export const useOTC = (buyer = BURN_ADDRESS) => {
    const { data, error } = useEtherSWR({
        abi: OTC_ABI,
        args: [
            [OTC_ADDRESS, 'dolaAllocations', buyer],
            [OTC_ADDRESS, 'buyDeadline'],
            [OTC_ADDRESS, 'redemptionTimestamp'],
        ],
    });

    const { balance: sinvBalance } = useTokenBalanceAndAllowance(SINV_ADDRESS, buyer, OTC_ADDRESS);
    const { balance: dolaBalance, allowance: dolaAllowance } = useTokenBalanceAndAllowance(DOLA, buyer, OTC_ADDRESS);
    const { balance: sharesBalance, bnBalance: sharesBalanceBn } = useTokenBalanceAndAllowance(OTC_ADDRESS, buyer, OTC_ADDRESS);
    const { data: sharesInvEquivalent } = useEtherSWR([SINV_ADDRESS, 'convertToAssets', sharesBalanceBn]);

    return {
        isLoading: !data && !error,
        dolaAllowance,
        dolaBalance,
        sinvBalance,
        dolaAllocation: data ? getBnToNumber(data[0], 18) : 0,
        sharesBalance,
        sharesBalanceBn,
        sharesInvEquivalent: sharesInvEquivalent ? getBnToNumber(sharesInvEquivalent) : 0,
        dolaAllocationBn: data ? data[0] : BigNumber.from('0'),
        buyDeadline: data ? getBnToNumber(data[1], 0) * 1000 : 0,
        redemptionTimestamp: data ? getBnToNumber(data[2], 0) * 1000 : 0,
        isBuyer: buyers.includes(buyer),
    }
}

const buy = async (signer: JsonRpcSigner, invAmount: number) => {
    const contract = new Contract(OTC_ADDRESS, OTC_ABI, signer);
    const sINV = new Contract(SINV_ADDRESS, SINV_ABI, signer);
    // same as previewDeposit
    const minOutShares = await sINV.convertToShares(getNumberToBn(invAmount));
    // 0.01% slippage
    return contract.buy(minOutShares.sub(minOutShares.div(10000)));
}

const redeem = (signer: JsonRpcSigner, lsInvAmount: BigNumber) => {
    const contract = new Contract(OTC_ADDRESS, OTC_ABI, signer);
    return contract.redeem(lsInvAmount);
}

export const OTCPage = () => {
    const { provider, account } = useWeb3React();
    const [now, setNow] = useState(Date.now());
    const viewAddress = useAccount();
    const otcData = useOTC(viewAddress);

    const { prices } = usePrices();

    const [isConnected, setConnected] = useState(true);

    useInterval(
        () => {
            setNow(Date.now());
        },
        1000
    )

    const {
        isLoading,
        isBuyer,
        dolaBalance,
        dolaAllocation,
        dolaAllocationBn,
        buyDeadline,
        redemptionTimestamp,
        dolaAllowance,
        sharesBalance,
        sharesBalanceBn,
        sharesInvEquivalent,
        sinvBalance,
    } = otcData;

    useDualSpeedEffect(() => {
        setConnected(!!account);
    }, [account], !account, 1000);

    const handleBuy = async () => {
        const invAmount = dolaAllocation / PRICE;
        return buy(provider?.getSigner(), invAmount);
    }

    const handleRedeem = () => {
        return redeem(provider?.getSigner(), sharesBalanceBn);
    }

    const isDealDone = !isLoading && isBuyer && !!buyDeadline && dolaAllocation === 0;
    const isDealReady = !isLoading && isBuyer && !!buyDeadline && now < buyDeadline && dolaAllocation > 0;
    const isDealExpired = !isLoading && isBuyer && !buyDeadline && now > buyDeadline && dolaAllocation > 0;
    const isRedeemed = !isLoading && isBuyer && !!redemptionTimestamp && now >= redemptionTimestamp && sharesBalance === 0;

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - OTC</title>
                <meta name="og:title" content="Inverse Finance - OTC" />
                <meta name="description" content="Inverse Finance OTC" />
                <meta name="og:description" content="Inverse Finance OTC" />
            </Head>
            <AppNav hideAnnouncement={true} />
            <VStack w={{ base: 'full' }} justify="center" alignItems="center" pt="0">
                <Stack
                    transform="translateY(-1px)"
                    alignItems="center"
                    direction={{ base: 'column', sm: 'row' }}
                    spacing="0"
                    bgColor="#111"
                    justify="space-evenly"
                    py="0"
                    px="4"
                    w={{ base: 'full' }}
                >
                    {/* <Text color="white" textAlign="center" fontWeight="extrabold" fontSize="30px">OTC</Text> */}
                    <Image src="/assets/partners/inv-handshake.png" w="50%" maxW='200px' />
                    {/* <Text color="white" textAlign="center" fontWeight="extrabold" fontSize="30px">Inverse Finance</Text> */}
                </Stack>
                <HStack px="4%" justify="space-between" pt="6" w='100%' maxW='500px'>
                    <VStack>
                        <HStack spacing="1">
                            <AnimatedInfoTooltip
                                message="Fixed value of 25 DOLA per INV in the OTC smart contract"
                                iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColor' }} />
                            <Text fontSize="16px">Fixed OTC INV price</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="24px">{PRICE} DOLA</Text>
                    </VStack>
                    <VStack>
                        <HStack spacing="1">
                            <AnimatedInfoTooltip
                                message="Coingecko price is shown for reference only."
                                iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColor' }} />
                            <Text fontSize="16px">Coingecko INV price</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="24px">{prices ? shortenNumber(prices['inverse-finance']?.usd, 2, true) : '-'}</Text>
                    </VStack>
                </HStack>
                <Stack px="4%" pt="6" w='full' justify="center" direction={{ base: 'column', lg: 'row' }} maxW="1300px" spacing="8">
                    {
                        !isConnected ? <Container noPadding p="0" alignItems='center' contentProps={{ maxW: '500px' }}>
                            <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                        </Container>
                            : <>
                                <Container noPadding p="0" label="OTC Details">
                                    <VStack minH={{ lg: '230px' }} w='full' justify="space-between">
                                        <VStack w='full' >
                                            <HStack w='full' justify="space-between">
                                                <Text color="mainTextColorLight">OTC Contract:</Text>
                                                <ScannerLink useName={false} value={OTC_ADDRESS} />
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text color="mainTextColorLight">INV buy deadline:</Text>
                                                <Text fontWeight="bold">{buyDeadline ? `${formatDateWithTime(buyDeadline)} (${fromNow(buyDeadline)})` : '-'}</Text>
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text color="mainTextColorLight">INV redemption activation:</Text>
                                                <Text fontWeight="bold">{redemptionTimestamp ? `${formatDateWithTime(redemptionTimestamp)} (${fromNow(redemptionTimestamp)})` : '-'}</Text>
                                            </HStack>
                                            {/* <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                                                <Text>Start Time:</Text>
                                                <Text fontWeight="bold">{lifetimeLimit ? `${formatDateWithTime(startTime)} (${timeSince(startTime)})` : '-'}</Text>
                                            </Stack>
                                            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                                                <Text>End Time:</Text>
                                                <Text fontWeight="bold">{lifetimeLimit ? `${formatDateWithTime(endTime)} (${timeSince(endTime)})` : '-'}</Text>
                                            </Stack> */}
                                            {/* <HStack w='full' justify="space-between">
                                                <Text>INV in contract:</Text>
                                                <Text fontWeight="bold">{preciseCommify(invBalance, 0)} INV</Text>
                                            </HStack> */}
                                        </VStack>
                                        {
                                            (isLoading || !!buyDeadline) ? null
                                                : <InfoMessage
                                                    alertProps={{ w: 'full', fontSize: '14px' }}
                                                    title="OTC dates are not initialized yet"
                                                    description={
                                                        <VStack spacing="0" w='full' alignItems="flex-start">
                                                            <Text>The deadline and redemption activation dates will be initialized when the proposal is executed</Text>
                                                            <Link isExternal target="_blank" textDecoration="underline" href="https://www.inverse.finance/governance/proposals/mills/305">See Governance proposal</Link>
                                                        </VStack>
                                                    }
                                                />
                                        }
                                    </VStack>
                                </Container>
                                <Container noPadding p="0" label="Execute OTC deal">
                                    <VStack minH={{ lg: '230px' }} w='full' alignItems="flex-start" justify="space-between">
                                        {
                                            isDealDone ? <VStack minH={{ lg: '230px' }} w='full' alignItems="flex-start" justify="space-between">
                                                {
                                                    isRedeemed ? <SuccessMessage
                                                        title="sINV redeemed!"
                                                        iconProps={{ height: 50, width: 50 }}
                                                        alertProps={{ w: 'full', fontSize: "24px", fontWeight: 'extrabold' }}
                                                    /> : <>
                                                        <SuccessMessage
                                                            title="INV purchase successful"
                                                            description={
                                                                <Text fontSize="16px">You will be able to redeem the sINV tokens after the redemption activation date</Text>
                                                            }
                                                            iconProps={{ height: 50, width: 50 }}
                                                            alertProps={{ w: 'full', fontSize: "24px", fontWeight: 'extrabold' }}
                                                        />
                                                        <VStack w='full' alignItems="flex-start" justify="space-between">
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">Receipt tokens held:</Text>
                                                                <Text>{preciseCommify(sharesBalance, 2)} lsInv (1 lsInv = 1 sINV after maturity)</Text>
                                                            </HStack>
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">INV equivalent:</Text>
                                                                <Text>{preciseCommify(sharesInvEquivalent, 2)} INV</Text>
                                                            </HStack>
                                                            <RSubmitButton
                                                                disabled={now < redemptionTimestamp}
                                                                onClick={handleRedeem}>
                                                                Redeem for sINV
                                                            </RSubmitButton>
                                                        </VStack>
                                                    </>
                                                }
                                            </VStack> :
                                                isBuyer ?
                                                    <VStack minH={{ lg: '230px' }} w='full' alignItems="flex-start" justify="space-between">
                                                        <VStack w='full' alignItems="flex-start" justify="space-between">

                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">DOLA to exchange:</Text>
                                                                <Text>
                                                                    {dolaAllocation ? `${preciseCommify(dolaAllocation, 0)} DOLA` : '-'}
                                                                </Text>
                                                            </HStack>
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">Total INV to receive:</Text>
                                                                <Text fontWeight="bold">
                                                                    {dolaAllocation ? `${preciseCommify(dolaAllocation / PRICE, 2)} INV` : '-'}
                                                                </Text>
                                                            </HStack>
                                                            {
                                                                dolaBalance < dolaAllocation ? <InfoMessage
                                                                    alertProps={{ w: 'full' }}
                                                                    title="Not enough DOLA"
                                                                    description={<VStack spacing="0" alignItems="flex-start">
                                                                        <Text>At least {preciseCommify(dolaAllocation, 0)} DOLA are needed in your wallet</Text>
                                                                        <Text>Currently there is {preciseCommify(dolaBalance, 0)} DOLA in your wallet</Text>
                                                                    </VStack>}
                                                                /> : <HStack w='full' justify="space-between">
                                                                    <Text color="mainTextColorLight">DOLA in your wallet:</Text>
                                                                    <Text>{preciseCommify(dolaBalance, 2)} DOLA</Text>
                                                                </HStack>
                                                            }
                                                        </VStack>
                                                        {
                                                            isDealExpired && <InfoMessage
                                                                alertProps={{ w: 'full' }}
                                                                title="The buy deadline has passed"
                                                            />
                                                        }
                                                        {
                                                            <HStack w='full' justify="space-between">
                                                                <ApproveButton
                                                                    address={DOLA}
                                                                    toAddress={OTC_ADDRESS}
                                                                    signer={provider?.getSigner()}
                                                                    isDisabled={!isDealReady || dolaAllowance >= dolaAllocation}
                                                                    forceRefresh={true}
                                                                    ButtonComp={RSubmitButton}
                                                                    tooltipMsg=""
                                                                    amount={dolaAllocationBn}
                                                                    onSuccess={() => {
                                                                        console.log('success');
                                                                    }}
                                                                >
                                                                    {
                                                                        dolaAllowance >= dolaAllocation && dolaAllocation > 0 ? '1/2 - DOLA spending Approved' : '1/2 - Approve DOLA spending'
                                                                    }
                                                                </ApproveButton>
                                                                <RSubmitButton
                                                                    disabled={!isDealReady || dolaAllowance < dolaAllocation || dolaBalance < dolaAllocation}
                                                                    onClick={handleBuy}>
                                                                    2/2 - Buy INV
                                                                </RSubmitButton>
                                                            </HStack>
                                                        }
                                                    </VStack>
                                                    : isConnected && !!viewAddress && <InfoMessage
                                                        alertProps={{ w: 'full' }}
                                                        description={
                                                            <>The <b><ScannerLink value={viewAddress} type="address" /></b> account is not part of this OTC deal</>
                                                        }
                                                    />
                                        }
                                    </VStack>
                                </Container>
                            </>
                    }
                </Stack>
            </VStack>
        </Layout>
    )
}

export default OTCPage