import { Stack, HStack, Image, VStack, Text } from '@chakra-ui/react'
import Head from 'next/head';
import Layout from '@app/components/common/Layout';
import { AppNav } from '@app/components/common/Navbar';
import { BigNumber, Contract } from 'ethers';
import { BURN_ADDRESS, ONE_DAY_SECS } from '@app/config/constants';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets';
import { usePrices } from '@app/hooks/usePrices';
;
import Container from '@app/components/common/Container';
import { preciseCommify } from '@app/util/misc';
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { JsonRpcSigner } from '@ethersproject/providers';
import { useAccount } from '@app/hooks/misc';
import ScannerLink from '@app/components/common/ScannerLink';
import { InfoMessage, SuccessMessage, WarningMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { Input } from '@app/components/common/Input';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { formatDateWithTime, fromNow, timeSince } from '@app/util/time';
import { shortenAddress } from '@app/util';
import { parseEther, parseUnits } from '@ethersproject/units';

const zero = BigNumber.from('0');

const DOLA = '0x865377367054516e17014CcdED1e7d814EDC9ce4';
const INV = '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';
const PRICE = 25;

const OTC_ABI = [
    "function buy() external returns (uint256 lsInvOut)",
    "function redeem(uint256 lsInvAmount) external",
    "function dolaAllocations(address buyer) public view returns (uint256)",
    "function INV_PRICE() public view returns (uint256)",
    "function buyDeadline() public view returns (uint256)",
    "function redemptionTimestamp() public view returns (uint256)",
]

const OTC_ADDRESS = BURN_ADDRESS;

const buyers = [
    '0x34A7a276eD77c6FE866c75Bbc8d79127c4E14a09',
]

export const useOTC = (buyer = BURN_ADDRESS) => {
    const now = Math.floor(Date.now() / 1000);
    const { data, error } = useEtherSWR([
        [DOLA, 'balanceOf', buyer],
        [OTC_ADDRESS, 'dolaAllocations', buyer],
        [OTC_ADDRESS, 'buyDeadline'],
        [OTC_ADDRESS, 'redemptionTimestamp'],
    ]);

    const [
        dolaBalanceBn,
        dolaAllocation,
        buyDeadline,
        redemptionTimestamp,
    ] = data ? data : [];

    return {
        isLoading: !data && !error,
        dolaAllocation: data ? getBnToNumber(parseEther('100000'), 18) : 0,
        buyDeadline: data ? getBnToNumber(parseUnits((now + 4 * ONE_DAY_SECS).toString(), 0), 0) * 1000 : 0,
        redemptionTimestamp: data ? getBnToNumber(parseUnits((now + 6 * 30 * ONE_DAY_SECS).toString(), 0), 0) * 1000 : 0,
        dolaBalance: data ? getBnToNumber(dolaBalanceBn, 18) : 0,
        isBuyer: buyers.includes(buyer),
    }
}

const buy = (signer: JsonRpcSigner) => {
    const contract = new Contract(OTC_ADDRESS, OTC_ABI, signer);
    return contract.buy();
}

export const OTCPage = () => {
    const { provider, account } = useWeb3React();
    const viewAddress = useAccount();
    const otcData = useOTC(viewAddress);

    const { prices } = usePrices();

    const [isConnected, setConnected] = useState(true);

    const {
        isLoading,
        isBuyer,
        dolaBalance,
        dolaAllocation,
        buyDeadline,
        redemptionTimestamp,
    } = otcData;

    useDualSpeedEffect(() => {
        setConnected(!!account);
    }, [account], !account, 1000);

    const handleAction = () => {
        return buy(provider?.getSigner());
    }

    const isDealDone = false;

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
                                    <VStack minH={{ lg: '250px' }} w='full' justify="space-between">
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
                                            isLoading ? null
                                                : <WarningMessage
                                                    alertProps={{ w: 'full', fontSize: '14px' }}
                                                    description={
                                                        <VStack spacing="0" w='full' alignItems="flex-start">
                                                            <Text>OTC dates not initialized yet (awaiting proposal execution)</Text>
                                                            <Link textDecoration="underline" href="/governance">See Governance</Link>
                                                        </VStack>
                                                    }
                                                />
                                        }
                                    </VStack>
                                </Container>
                                <Container noPadding p="0" label="Execute OTC deal">
                                    {
                                        isBuyer ? <VStack w='full' alignItems="flex-start" justify="space-between">
                                            {
                                                isDealDone ? null :
                                                    <VStack minH={{ lg: '250px' }} w='full' alignItems="flex-start" justify="space-between">
                                                        <VStack w='full' alignItems="flex-start" justify="space-between">
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">DOLA in your wallet:</Text>
                                                                <Text>{preciseCommify(dolaBalance, 2)} DOLA</Text>
                                                            </HStack>
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">DOLA to exchange:</Text>
                                                                <Text>
                                                                    {dolaAllocation ? `${preciseCommify(dolaAllocation, 2)} DOLA` : '-'}
                                                                </Text>
                                                            </HStack>
                                                            <HStack w='full' justify="space-between">
                                                                <Text color="mainTextColorLight">Total INV to receive:</Text>
                                                                <Text fontWeight="bold">
                                                                    {dolaAllocation ? `${preciseCommify(dolaAllocation / PRICE, 2)} INV` : '-'}
                                                                </Text>
                                                            </HStack>
                                                        </VStack>
                                                        <HStack w='full' justify="space-between">
                                                            <SimpleAmountForm
                                                                decimals={18}
                                                                // defaultAmount={amount}
                                                                address={DOLA}
                                                                destination={OTC_ADDRESS}
                                                                signer={provider?.getSigner()}
                                                                // maxAmountFrom={[dolaBalanceBn]}
                                                                onAction={handleAction}
                                                                // onMaxAction={handleAction}
                                                                actionLabel={'Swap USDC'}
                                                                hideInputIfNoAllowance={false}
                                                                // onAmountChange={(v) => setAmount(v)}
                                                                showMaxBtn={false}
                                                                showBalance={false}
                                                                hideInput={true}
                                                                onlyShowApproveBtn={true}
                                                                // isDisabled={isDisabled}
                                                                // isError={hasError}
                                                                inputProps={{ placeholder: 'USDC to swap' }}
                                                                btnProps={{ fontSize: '18px' }}
                                                            />
                                                        </HStack>
                                                    </VStack>
                                            }

                                            {
                                                isDealDone && <SuccessMessage
                                                    description="INV purchase sealed!"
                                                    iconProps={{ height: 50, width: 50 }}
                                                    alertProps={{ w: 'full', fontSize: "24px", fontWeight: 'extrabold' }}
                                                />
                                            }
                                        </VStack>
                                            : <InfoMessage
                                                alertProps={{ w: 'full' }}
                                                description={
                                                    <>The <b><ScannerLink value={viewAddress} type="address" /></b> account is not part of this OTC deal</>
                                                }
                                            />
                                    }
                                </Container>
                            </>
                    }
                </Stack>
            </VStack>
        </Layout>
    )
}

export default OTCPage