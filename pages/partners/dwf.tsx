import { Stack, HStack, Image, VStack, Text } from '@chakra-ui/react'
import Head from 'next/head';
import Layout from '@app/components/common/Layout';
import { AppNav } from '@app/components/common/Navbar';
import { BigNumber, Contract } from 'ethers';
import { BURN_ADDRESS, DWF_PURCHASER } from '@app/config/constants';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets';
import { usePrices } from '@app/hooks/usePrices';
 ;
import Container from '@app/components/common/Container';
import { preciseCommify } from '@app/util/misc';
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { DWF_PURCHASER_ABI } from '@app/config/abis';
import { JsonRpcSigner } from '@ethersproject/providers';
import { useAccount } from '@app/hooks/misc';
import ScannerLink from '@app/components/common/ScannerLink';
import { InfoMessage, SuccessMessage, WarningMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { Input } from '@app/components/common/Input';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { formatDateWithTime, timeSince } from '@app/util/time';

const zero = BigNumber.from('0');

const USDC_DECIMALS = 6;
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const INV = '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';

export const useDWFPurchaser = (buyer = BURN_ADDRESS) => {
  const { data, error } = useEtherSWR([
    [DWF_PURCHASER, 'getInvPrice'],
    [DWF_PURCHASER, 'startTime'],
    [DWF_PURCHASER, 'runTime'],
    [DWF_PURCHASER, 'lastBuy'],
    [DWF_PURCHASER, 'dailyLimit'],
    [DWF_PURCHASER, 'dailyBuy'],
    [DWF_PURCHASER, 'lifetimeLimit'],
    [DWF_PURCHASER, 'lifetimeBuy'],
    [DWF_PURCHASER, 'limitAvailable'],
    [DWF_PURCHASER, 'minInvPrice'],
    [DWF_PURCHASER, 'discountBps'],
    [DWF_PURCHASER, 'lastReset'],
    [DWF_PURCHASER, 'whitelist', buyer],
    [USDC, 'balanceOf', buyer],
    [INV, 'balanceOf', DWF_PURCHASER],
    [INV, 'balanceOf', buyer],
  ]);

  const [
    invPrice,
    startTime,
    runTime,
    lastBuy,
    dailyLimit,
    dailyBuy,
    lifetimeLimit,
    lifetimeBuy,
    limitAvailable,
    minInvPrice,
    discountBps,
    lastReset,
    isWhitelisted,
    usdcBalance,
    invBalance,
    myInvBalance,
  ] = data || [zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, false, zero, zero, zero];

  return {
    isLoading: !data && !error,
    // contract uses an inv price normalized for USDC's decimals
    invPrice: data ? getBnToNumber(invPrice, USDC_DECIMALS) : 0,
    startTime: data ? getBnToNumber(startTime, 0) * 1000 : 0,
    runTime: data ? getBnToNumber(runTime, 0) * 1000 : 0,
    endTime: data ? getBnToNumber(startTime, 0) * 1000 + getBnToNumber(runTime, 0) * 1000 : 0,
    lastBuy: data ? getBnToNumber(lastBuy, 0) * 1000 : 0,
    lastReset: data ? getBnToNumber(lastReset, 0) * 1000 : 0,
    dailyLimit: data ? getBnToNumber(dailyLimit, USDC_DECIMALS) : 0,
    dailyBuy: data ? getBnToNumber(dailyBuy, USDC_DECIMALS) : 0,
    lifetimeLimit: data ? getBnToNumber(lifetimeLimit, USDC_DECIMALS) : 0,
    lifetimeBuy: data ? getBnToNumber(lifetimeBuy, USDC_DECIMALS) : 0,
    limitAvailable: data ? getBnToNumber(limitAvailable, USDC_DECIMALS) : 0,
    limitAvailableBn: data ? limitAvailable : zero,
    minInvPrice: data ? getBnToNumber(minInvPrice, USDC_DECIMALS) : 0,
    discountBps: data ? getBnToNumber(discountBps, 4) : 0,
    usdcBalance: data ? getBnToNumber(usdcBalance, USDC_DECIMALS) : 0,
    usdcBalanceBn: data ? usdcBalance : zero,
    invBalance: data ? getBnToNumber(invBalance) : 0,
    myInvBalance: data ? getBnToNumber(myInvBalance) : 0,
    invBalanceBn: data ? invBalance : zero,
    isWhitelisted: data ? isWhitelisted : true,
  }
}

const buy = (bnAmount: BigNumber, maxInvPrice: BigNumber, signer: JsonRpcSigner) => {
  const contract = new Contract(DWF_PURCHASER, DWF_PURCHASER_ABI, signer);
  return contract.buy(bnAmount, maxInvPrice);
}

export const DWFPage = () => {
  const { provider, account } = useWeb3React();
  const viewAddress = useAccount();
  const dwfData = useDWFPurchaser(viewAddress);
  const { prices } = usePrices();

  const [isConnected, setConnected] = useState(true);
  const [amount, setAmount] = useState('');
  const [maxSlippage, setMaxSlippage] = useState('1');
  const {
    isLoading,
    myInvBalance,
    invPrice,
    startTime,
    endTime,
    lastBuy,
    limitAvailable,
    lifetimeBuy,
    dailyLimit,
    dailyBuy,
    discountBps,
    invBalanceBn,
    limitAvailableBn,
    usdcBalanceBn,
    usdcBalance,
    minInvPrice,
    lifetimeLimit,
    invBalance,
    isWhitelisted,
    lastReset,
  } = dwfData;

  const maxInvPrice = invPrice * (1 + parseFloat(maxSlippage) / 100);

  const floatAmount = parseFloat(amount || '0');
  const hasError = invPrice < minInvPrice
    || usdcBalance < floatAmount
    || floatAmount > limitAvailable
    ;

  const isDisabled = !floatAmount || !maxSlippage || hasError;

  const invNormalPurchase = invPrice ? floatAmount / invPrice : 0;
  const discountedPrice = invPrice ? invPrice - invPrice * discountBps : 0;
  const maxDiscountedPrice = maxInvPrice ? maxInvPrice - maxInvPrice * discountBps : 0;
  const invDiscountedPurchase = discountedPrice ? floatAmount / discountedPrice : 0;
  const invBonus = invDiscountedPurchase - invNormalPurchase;
  const spentToday = lastBuy >= lastReset ? dailyBuy : 0;

  useDualSpeedEffect(() => {
    setConnected(!!account);
  }, [account], !account, 1000);

  const handleAction = (params) => {
    return buy(params.bnAmount, getNumberToBn(maxInvPrice, USDC_DECIMALS), provider?.getSigner());
  }

  const handleMaxSlippage = (value: string) => {
    const newSlippage = value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1')
    setMaxSlippage(newSlippage);
  }

  const dailyLimitReached = isLoading ? false : limitAvailable <= 0;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DWF</title>
        <meta name="og:title" content="Inverse Finance - DWF" />
        <meta name="description" content="Inverse Finance DWF" />
        <meta name="og:description" content="Inverse Finance DWF" />
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
          <Image src="/assets/partners/dwf-labs.svg" w="50%" maxW='200px' />
          <Image src="/assets/partners/inv-handshake.png" w="50%" maxW='200px' />
          <Text color="white" textAlign="center" fontWeight="extrabold" fontSize="30px">Inverse Finance</Text>
        </Stack>
        <HStack px="4%" justify="space-between" pt="6" w='100%' maxW='500px'>
          <VStack>
            <HStack spacing="1">
              <AnimatedInfoTooltip
                message="Smart contracts can only read data from the blockchain, here the price is taken from Balancer which has the deepest liquidity pool on ethereum for INV."
                iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColor' }} />
              <Text fontSize="16px">INV price (OTC)</Text>
            </HStack>
            <Text fontWeight="bold" fontSize="24px">{invPrice ? shortenNumber(invPrice, 2, true) : '-'}</Text>
          </VStack>
          <VStack>
            <HStack spacing="1">
              <AnimatedInfoTooltip
                message="Coingecko price is shown for reference only."
                iconProps={{ fontSize: '12px', mr: "1", color: 'mainTextColor' }} />
              <Text fontSize="16px">INV price (coingecko)</Text>
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
                <Container noPadding p="0" label="OTC Agreement">
                  <VStack minH={{ lg: dailyLimitReached ? '380px' : '460px' }} w='full' justify="space-between">
                    <VStack w='full' >
                      <HStack w='full' justify="space-between">
                        <Text>Discount to apply:</Text>
                        <Text fontWeight="bold" color="success" fontSize="20px">{shortenNumber(discountBps * 100, 2)}%</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>OTC Contract:</Text>
                        <ScannerLink useName={false} value={DWF_PURCHASER} />
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Min INV price:</Text>
                        <Text fontWeight="bold">{shortenNumber(minInvPrice, 2, true)}</Text>
                      </HStack>
                      <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                        <Text>Start Time:</Text>
                        <Text fontWeight="bold">{lifetimeLimit ? `${formatDateWithTime(startTime)} (${timeSince(startTime)})` : '-'}</Text>
                      </Stack>
                      <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                        <Text>End Time:</Text>
                        <Text fontWeight="bold">{lifetimeLimit ? `${formatDateWithTime(endTime)} (${timeSince(endTime)})` : '-'}</Text>
                      </Stack>
                      <HStack w='full' justify="space-between">
                        <Text>Total Spend Limit:</Text>
                        <Text fontWeight="bold">{preciseCommify(lifetimeLimit, 0)} USDC</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Daily Spend Limit:</Text>
                        <Text fontWeight="bold">{preciseCommify(dailyLimit, 0)} USDC</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>INV in contract:</Text>
                        <Text fontWeight="bold">{preciseCommify(invBalance, 0)} INV</Text>
                      </HStack>
                    </VStack>
                    {
                      lifetimeLimit || isLoading ? <InfoMessage
                        alertProps={{ w: 'full', fontSize: '14px' }}
                        description={
                          <VStack spacing="0" w='full' alignItems="flex-start">
                            <HStack spacing="1">
                              <Text>Recommendation: use flashbot rpc, </Text>
                              <Link href="https://docs.flashbots.net/flashbots-protect/rpc/quick-start" isExternal target="_blank">learn more</Link>
                            </HStack>
                            <Link href="/governance/proposals/mills/84">See Initial Governance proposal</Link>
                            <Link href="/governance/proposals/mills/85">See Whitelist change Governance proposal</Link>
                            <Link href="/governance/proposals/mills/87">See Final Governance proposal</Link>
                          </VStack>
                        }
                      />
                        : <WarningMessage
                          alertProps={{ w: 'full', fontSize: '14px' }}
                          description={
                            <VStack spacing="0" w='full' alignItems="flex-start">
                              <Text>Agreement details not initialized yet (awaiting proposal execution)</Text>
                              <Link href="/governance">See Governance</Link>
                            </VStack>
                          }
                        />
                    }
                  </VStack>
                </Container>
                <Container noPadding p="0" label="Swap USDC to INV">
                  {isWhitelisted ? <VStack minH={{ lg: dailyLimitReached ? '380px' : '460px' }} w='full' alignItems="flex-start" justify="space-between">
                    <VStack w='full' alignItems="flex-start">
                      <HStack w='full' justify="space-between">
                        <Text>Currently spendable:</Text>
                        <Text fontWeight="bold" color="success" fontSize="20px">{preciseCommify(limitAvailable, 2)} USDC</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>In your wallet:</Text>
                        <Text>{preciseCommify(usdcBalance, 2)} USDC</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Total already spent:</Text>
                        <Text>{preciseCommify(lifetimeBuy, 2)} USDC</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Spent today:</Text>
                        <Text>{preciseCommify(spentToday, 2)} USDC</Text>
                      </HStack>
                      <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                        <Text>Last swap:</Text>
                        <Text>{
                          lastBuy >= startTime ? `${formatDateWithTime(lastBuy)} (${timeSince(lastBuy)})` : '-'
                        }</Text>
                      </Stack>
                      {
                        dailyLimitReached ? null :
                          <>
                            <HStack w='full' justify="space-between">
                              <SimpleAmountForm
                                decimals={USDC_DECIMALS}
                                defaultAmount={amount}
                                address={USDC}
                                destination={DWF_PURCHASER}
                                signer={provider?.getSigner()}
                                maxAmountFrom={[usdcBalanceBn, limitAvailableBn]}
                                onAction={handleAction}
                                onMaxAction={handleAction}
                                actionLabel={'Swap USDC'}
                                hideInputIfNoAllowance={false}
                                onAmountChange={(v) => setAmount(v)}
                                showMaxBtn={false}
                                // showBalance={true}
                                isDisabled={isDisabled}
                                isError={hasError}
                                inputProps={{ placeholder: 'USDC to swap' }}
                                btnProps={{ fontSize: '18px' }}
                              />
                            </HStack>
                            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                              <Text>OTC INV price:</Text>
                              <Text>
                                ~{shortenNumber(invPrice, 2, true)} => ~{shortenNumber(discountedPrice, 2, true)} (discounted)
                              </Text>
                            </Stack>
                            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                              <Text>Max. INV price slippage %:</Text>
                              <Input border={!maxSlippage ? '1px solid red' : 'none'} maxH="30px" p="8px" w='80px' placeholder="0" value={maxSlippage} onChange={(e) => handleMaxSlippage(e.target.value)} />
                            </Stack>
                            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
                              <Text>Max. INV price to accept:</Text>
                              <Text>
                                ~{shortenNumber(maxInvPrice, 2, true)} => ~{shortenNumber(maxDiscountedPrice, 2, true)} (discounted)
                              </Text>
                            </Stack>
                            <HStack w='full' justify="space-between">
                              <Text>Swapping:</Text>
                              <Text>
                                {invNormalPurchase ? `~${preciseCommify(invNormalPurchase, 2)} INV (${shortenNumber(invPrice * invNormalPurchase, 2, true)})` : '-'}
                              </Text>
                            </HStack>
                            <HStack w='full' justify="space-between">
                              <Text>Surplus thanks to the discount:</Text>
                              <Text>
                                {invBonus ? `~${preciseCommify(invBonus, 2)} INV (${shortenNumber(invPrice * invBonus, 2, true)})` : '-'}
                              </Text>
                            </HStack>
                            <HStack w='full' justify="space-between">
                              <Text>Total INV to receive:</Text>
                              <Text fontWeight="bold">
                                {invNormalPurchase ? `~${preciseCommify(invDiscountedPurchase, 2)} INV (${shortenNumber(invPrice * invDiscountedPurchase, 2, true)})` : '-'}
                              </Text>
                            </HStack>
                          </>
                      }
                    </VStack>
                    {
                      dailyLimitReached && <SuccessMessage
                        description="Daily Swap Limit Reached!"
                        iconProps={{ height: 50, width: 50 }}
                        alertProps={{ w: 'full', fontSize: "24px", fontWeight: 'extrabold' }}
                      />
                    }
                  </VStack>
                    : <InfoMessage
                      alertProps={{ w: 'full' }}
                      description="Your account is not whitelisted for this OTC contract"
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

export default DWFPage