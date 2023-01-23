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

const zero = BigNumber.from('0');

const USDC_DECIMALS = 6;
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const INV = '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68';

export const useDWFPurchaser = (buyer = BURN_ADDRESS) => {
  const { data } = useEtherSWR([
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
  ] = data || [zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, zero, false, zero, zero];

  return {
    invPrice: data ? getBnToNumber(invPrice) : 0,
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
    minInvPrice: data ? getBnToNumber(minInvPrice) : 0,
    bonusBps: data ? getBnToNumber(bonusBps, 4) : 0,
    usdcBalance: data ? getBnToNumber(usdcBalance, USDC_DECIMALS) : 0,
    usdcBalanceBn: data ? usdcBalance : zero,
    invBalance: data ? getBnToNumber(invBalance) : 0,
    invBalanceBn: data ? invBalance : zero,
    isWhitelisted: data ? isWhitelisted : false,
  }
}

const buy = (bnAmount: BigNumber, maxInvPrice: BigNumber, signer: JsonRpcSigner) => {
  const contract = new Contract(DWF_PURCHASER, DWF_PURCHASER_ABI, signer);
  return contract.buy(bnAmount, maxInvPrice);
}

export const DWFPage = () => {
  const { library } = useWeb3React();
  const account = useAccount();
  const dwfData = useDWFPurchaser(account);
  const prices = usePrices();
  const [amount, setAmount] = useState('');
  const [maxSlippage, setMaxSlippage] = useState('1');
  const { invPrice, startTime, endTime, lastBuy, limitAvailable, lifetimeBuy, dailyLimit, dailyBuy, bonusBps,invBalanceBn,limitAvailableBn, usdcBalanceBn, usdcBalance, minInvPrice, lifetimeLimit, invBalance, isWhitelisted } = dwfData;

  const handleAction = (params) => {
    const maxInvPrice = getNumberToBn(invPrice * (1+parseFloat(maxSlippage)/100));
    return buy(params.bnAmount, maxInvPrice, library?.getSigner());
  }

  const hasError = invPrice < minInvPrice || usdcBalance < parseFloat(amount||'0') || parseFloat(amount||'0') > limitAvailable;

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - DWF</title>
        <meta name="og:title" content="Inverse Finance - DWF" />
        <meta name="description" content="Inverse Finance DWF" />
        <meta name="og:description" content="Inverse Finance DWF" />
      </Head>
      <AppNav />
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
          <Text color="white" textAlign="center" fontWeight="extrabold" fontSize="24px">Inverse Finance</Text>
        </Stack>
        <Stack pt="8" w='full' direction={{ base: 'column', sm: 'row' }} maxW="1100px" spacing="8">
          <Container noPadding p="0" label="OTC Deal Agreement">
            <VStack w='full'>
              <HStack w='full' justify="space-between">
                <Text>Bonus to apply:</Text>
                <Text fontWeight="bold" color="success" fontSize="20px">{shortenNumber(bonusBps * 100, 2)}%</Text>
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>Contract:</Text>
                <ScannerLink useName={false} value={DWF_PURCHASER} />
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>Min INV price:</Text>
                <Text fontWeight="bold">{shortenNumber(minInvPrice, 2, true)}</Text>
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>Start Time:</Text>
                <Text fontWeight="bold">{moment(startTime).format('MMM Do YYYY, hh:mm a')} ({moment(startTime).fromNow()})</Text>
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>End Time:</Text>
                <Text fontWeight="bold">{moment(endTime).format('MMM Do YYYY, hh:mm a')} ({moment(endTime).fromNow()})</Text>
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
                <Text>INV currently in held the contract:</Text>
                <Text fontWeight="bold">{preciseCommify(invBalance, 0)} INV</Text>
              </HStack>
            </VStack>
          </Container>
          <Container noPadding p="0" label="Buy INV">
            <VStack w='full'>
              <HStack w='full' justify="space-between">
                <Text>Currently spendable:</Text>
                <Text fontWeight="bold" color="success" fontSize="20px">{shortenNumber(limitAvailable, 2)} USDC</Text>
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>Total spent:</Text>
                <Text>{shortenNumber(lifetimeBuy, 2)} USDC</Text>
              </HStack>
              <HStack w='full' justify="space-between">
                <Text>Spent Today:</Text>
                <Text>{shortenNumber(dailyBuy, 2)} USDC</Text>
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
                  actionLabel={'Buy'}
                  maxActionLabel={'Buy MAX available'}
                  hideInputIfNoAllowance={false}
                  onAmountChange={(v) => setAmount(v)}
                  showMaxBtn={true}
                  showBalance={true}
                  isDisabled={hasError}
                  isError={hasError}
                />
                {/* <Text>Inv Oracle Price (Balancer Pool):</Text> */}
                {/* <Text>{shortenNumber(invPrice, 2, true)}</Text> */}
              </HStack>
            </VStack>
          </Container>
        </Stack>
      </VStack>
    </Layout>
  )
}

export default DWFPage