import { Stack, HStack, Image, VStack, Text } from '@chakra-ui/react'
import Head from 'next/head';
import Layout from '@app/components/common/Layout';
import { AppNav } from '@app/components/common/Navbar';
import { BigNumber, Contract } from 'ethers';
import { BURN_ADDRESS, DWF_PURCHASER } from '@app/config/constants';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { getBnToNumber, getNumberToBn, shortenNumber } from '@app/util/markets';
import { usePrices } from '@app/hooks/usePrices';
import moment from 'moment';
import Container from '@app/components/common/Container';
import { preciseCommify } from '@app/util/misc';
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { DWF_PURCHASER_ABI } from '@app/config/abis';
import { JsonRpcSigner } from '@ethersproject/providers';
import { useAccount } from '@app/hooks/misc';
import ScannerLink from '@app/components/common/ScannerLink';
import { InfoMessage, WarningMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { Input } from '@app/components/common/Input';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';

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
    [DWF_PURCHASER, 'bonusBps'],
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
    bonusBps,
    isWhitelisted,
    usdcBalance,
    invBalance,
    myInvBalance,
  ] = data || [zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, false, zero, zero, zero];

  return {
    isLoading: !data && !error,
    // contract uses an inv price normalized for USDC's decimals
    invPrice: data ? getBnToNumber(invPrice, USDC_DECIMALS) : 0,
    startTime: data ? getBnToNumber(startTime, 0) * 1000 : 0,
    runTime: data ? getBnToNumber(runTime, 0) * 1000 : 0,
    endTime: data ? getBnToNumber(startTime, 0) * 1000 + getBnToNumber(runTime, 0) * 1000 : 0,
    lastBuy: data ? getBnToNumber(lastBuy, 0) * 1000 : 0,
    dailyLimit: data ? getBnToNumber(dailyLimit, USDC_DECIMALS) : 0,
    dailyBuy: data ? getBnToNumber(dailyBuy, USDC_DECIMALS) : 0,
    lifetimeLimit: data ? getBnToNumber(lifetimeLimit, USDC_DECIMALS) : 0,
    lifetimeBuy: data ? getBnToNumber(lifetimeBuy, USDC_DECIMALS) : 0,
    limitAvailable: data ? getBnToNumber(limitAvailable, USDC_DECIMALS) : 0,
    limitAvailableBn: data ? limitAvailable : zero,
    minInvPrice: data ? getBnToNumber(minInvPrice, USDC_DECIMALS) : 0,
    bonusBps: data ? getBnToNumber(bonusBps, 4) : 0,
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
  const { library, account } = useWeb3React();
  const viewAddress = useAccount();
  const dwfData = useDWFPurchaser(viewAddress);
  const { prices } = usePrices();

  const [isConnected, setConnected] = useState(true);
  const [amount, setAmount] = useState('');
  const [maxSlippage, setMaxSlippage] = useState('2');
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
    bonusBps,
    invBalanceBn,
    limitAvailableBn,
    usdcBalanceBn,
    usdcBalance,
    minInvPrice,
    lifetimeLimit,
    invBalance,
    isWhitelisted,
  } = dwfData;

  const maxInvPrice = invPrice * (1 + parseFloat(maxSlippage) / 100);

  const floatAmount = parseFloat(amount || '0');
  const hasError = invPrice < minInvPrice
    || usdcBalance < floatAmount
    || floatAmount > limitAvailable
    ;

  const isDisabled = !floatAmount || !maxSlippage || hasError;

  const invNormalPurchase = invPrice ? floatAmount / invPrice : 0;
  const invBonus = invNormalPurchase * bonusBps;
  const invTotal = invNormalPurchase + invBonus;

  useDualSpeedEffect(() => {
    setConnected(!!account);
  }, [account], !account, 1000);

  const handleAction = (params) => {
    return buy(params.bnAmount, getNumberToBn(maxInvPrice, USDC_DECIMALS), library?.getSigner());
  }

  const handleMaxSlippage = (value: string) => {
    const newSlippage = value.replace(/[^0-9.]/, '').replace(/(?<=\..*)\./g, '')
    setMaxSlippage(newSlippage);
  }

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - DWF</title>
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
            <Text fontSize="16px">INV price (OTC)</Text>
            <Text fontWeight="bold" fontSize="24px">{invPrice ? shortenNumber(invPrice, 2, true) : '-'}</Text>
          </VStack>
          <VStack>
            <Text fontSize="16px">INV price (Coingecko)</Text>
            <Text fontWeight="bold" fontSize="24px">{prices ? shortenNumber(prices['inverse-finance']?.usd, 2, true) : '-'}</Text>
          </VStack>
        </HStack>
        <Stack px="4%" pt="6" w='full' justify="center" direction={{ base: 'column', sm: 'row' }} maxW="1300px" spacing="8">
          {
            !isConnected ? <Container noPadding p="0" alignItems='center' contentProps={{ maxW: '500px' }}>
              <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
            </Container>
              : <>
                <Container noPadding p="0" label="OTC Agreement">
                  <VStack minH="400px" w='full' justify="space-between">
                    <VStack w='full' >
                      <HStack w='full' justify="space-between">
                        <Text>Bonus to apply:</Text>
                        <Text fontWeight="bold" color="success" fontSize="20px">{shortenNumber(bonusBps * 100, 2)}%</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>OTC Contract:</Text>
                        <ScannerLink useName={false} value={DWF_PURCHASER} />
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Min INV price:</Text>
                        <Text fontWeight="bold">{shortenNumber(minInvPrice, 2, true)}</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>Start Time:</Text>
                        <Text fontWeight="bold">{lifetimeLimit ? `${moment(startTime).format('MMM Do YYYY, hh:mm a')} (${moment(startTime).fromNow()})` : '-'}</Text>
                      </HStack>
                      <HStack w='full' justify="space-between">
                        <Text>End Time:</Text>
                        <Text fontWeight="bold">{lifetimeLimit ? `${moment(endTime).format('MMM Do YYYY, hh:mm a')} (${moment(endTime).fromNow()})` : '-'}</Text>
                      </HStack>
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
                <Container noPadding p="0" label="Buy INV with USDC">
                  {isWhitelisted ? <VStack minH="400px" w='full'>
                    <HStack w='full' justify="space-between">
                      <Text>Currently spendable:</Text>
                      <Text fontWeight="bold" color="success" fontSize="20px">{preciseCommify(limitAvailable, 2)} USDC</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Total already spent:</Text>
                      <Text>{preciseCommify(lifetimeBuy, 2)} USDC</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Spent Today:</Text>
                      <Text>{preciseCommify(dailyBuy, 2)} USDC</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Last Buy:</Text>
                      <Text>{
                        lastBuy >= startTime ? `${moment(lastBuy).format('MMM Do YYYY, hh:mm a')} (${moment(lastBuy).fromNow()})` : '-'
                      }</Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <SimpleAmountForm
                        decimals={USDC_DECIMALS}
                        defaultAmount={amount}
                        address={USDC}
                        destination={DWF_PURCHASER}
                        signer={library?.getSigner()}
                        maxAmountFrom={[usdcBalanceBn, limitAvailableBn]}
                        onAction={handleAction}
                        onMaxAction={handleAction}
                        actionLabel={'Spend USDC'}
                        // maxActionLabel={'Buy MAX available'}
                        hideInputIfNoAllowance={false}
                        onAmountChange={(v) => setAmount(v)}
                        showMaxBtn={false}
                        // showBalance={true}
                        isDisabled={isDisabled}
                        isError={hasError}
                        inputProps={{ placeholder: 'USDC to spend' }}
                        btnProps={{ fontSize: '18px' }}
                      />
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Max. slippage %:</Text>
                      <Input border={!maxSlippage ? '1px solid red' : 'none'} maxH="30px" p="8px" w='80px' placeholder="0" value={maxSlippage} onChange={(e) => handleMaxSlippage(e.target.value)} />
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Max. INV price to accept:</Text>
                      <Text>
                        ~{shortenNumber(maxInvPrice, 2, true)}
                      </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Purchasing:</Text>
                      <Text>
                        {invNormalPurchase ? `~${preciseCommify(invNormalPurchase, 2)} INV (${shortenNumber(invPrice * invNormalPurchase, 2, true)})` : '-'}
                      </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Bonus to receive:</Text>
                      <Text>
                        {invNormalPurchase ? `~${preciseCommify(invBonus, 2)} INV (${shortenNumber(invPrice * invBonus, 2, true)})` : '-'}
                      </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                      <Text>Total INV to receive:</Text>
                      <Text fontWeight="bold">
                        {invNormalPurchase ? `~${preciseCommify(invTotal, 2)} INV (${shortenNumber(invPrice * invTotal, 2, true)})` : '-'}
                      </Text>
                    </HStack>
                  </VStack> : <InfoMessage
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