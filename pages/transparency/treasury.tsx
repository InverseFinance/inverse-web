import { Flex, SimpleGrid, SlideFade, Stack, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Prices } from '@app/types'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { Funds, getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { CHAIN_TOKENS, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'

const FundsDetails = ({ funds, title, prices }: { funds: any, title: string, prices: Prices["prices"] }) => {
  const [data, setData] = useState(funds);
  const [isDrilled, setIsDrilled] = useState(false);
  const [isAfterSlideEffect, setIsAfterSlideEffect] = useState(false);
  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    setData(funds);
  }, [funds])

  const handleDrill = (datum) => {
    if (datum?.fund?.drill) {
      setData(datum?.fund?.drill);
      setIsDrilled(true);
      setSubtitle(datum?.fund?.label || datum?.fund?.token?.symbol);
    }
  }

  const reset = () => {
    setIsDrilled(false);
    setData(funds);
  }

  useDualSpeedEffect(() => {
    setIsAfterSlideEffect(isDrilled);
  }, [isDrilled], isDrilled, 500, 500);

  return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '400px' }}>
    <Stack>
      <Text color="secondary" fontSize="20px" fontWeight="extrabold">{title}:</Text>
      <Stack spacing="0" justify="center" alignItems="center" position="relative">
        {
          isDrilled && <Flex cursor="pointer" onClick={reset} alignItems="center"  color="secondary" fontSize="12px" position="absolute" left="0" top="0">
            <ArrowLeftIcon fontSize="10px" color="secondary"/>
            <Text ml="1"  color="secondary">Back</Text>
          </Flex>
        }
        {
          isDrilled && <Flex alignItems="center"  color="secondary" fontSize="12px" position="absolute" right="0" top="0">
            <Text color="secondary">{subtitle}</Text>
          </Flex>
        }
        {
          data?.length && <Funds handleDrill={isDrilled ? undefined : handleDrill} prices={prices} funds={data} chartMode={true} showTotal={true} />
        }
      </Stack>
    </Stack>

    <SlideFade in={!isDrilled} unmountOnExit={true}>
      <Stack fontSize="12px" spacing="2">
        <Funds prices={prices} funds={funds} showPrice={false} showTotal={false} />
      </Stack>
    </SlideFade>
    {
      isAfterSlideEffect && <SlideFade in={isDrilled} unmountOnExit={true}>
        <Stack fontSize="12px" spacing="2">
          <Funds prices={prices} funds={data} showPrice={false} showTotal={false} />
        </Stack>
      </SlideFade>
    }
  </Stack >
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { treasury, anchorReserves, bonds, multisigs, pols } = useDAO();

  const TWGfunds = multisigs?.find(m => m.shortName === 'TWG')?.funds || [];
  const TWGFtmfunds = multisigs?.find(m => m.shortName === 'TWG on FTM')?.funds || [];

  const totalHoldings = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury, prices), usdPrice: 1, drill: treasury },
    { label: 'Anchor Reserves', balance: getFundsTotalUsd(anchorReserves, prices), usdPrice: 1, drill: anchorReserves },
    { label: 'Bonds Manager Contract', balance: getFundsTotalUsd(bonds.balances, prices), usdPrice: 1, drill: bonds.balances },
    { label: 'Multisigs', balance: getFundsTotalUsd(TWGfunds.concat(TWGFtmfunds), prices), usdPrice: 1, drill: TWGfunds.concat(TWGFtmfunds) },
  ];

  const polsFunds = pols.map(p => {
    return {
      title: `${CHAIN_TOKENS[p.chainId][p.address]?.symbol} Liquidity`,
      funds: [
        { token: { symbol: CHAIN_TOKENS[p.chainId][p.address]?.symbol }, label: 'Protocol Owned', balance: p.ownedAmount },
        { token: { symbol: CHAIN_TOKENS[p.chainId][p.address]?.symbol }, label: 'Not Protocol Owned', balance: p.totalSupply - p.ownedAmount },
      ],
    }
  })

  const totalMultisigs = multisigs?.map(m => {
    return { label: m.name, balance: getFundsTotalUsd(m.funds, prices, 'both'), usdPrice: 1, drill: m.funds }
  });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Treasury</title>
      </Head>
      <AppNav active="Transparency" activeSubmenu="Treasury" />
      <TransparencyTabs active="treasury" />
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2" px="5" maxWidth="1200px" w='full'>
          <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">
            <SimpleGrid minChildWidth={{ base: '300px', sm: '400px' }} spacingX="100px" spacingY="40px">
              <FundsDetails title="Total Treasury Holdings" funds={totalHoldings} prices={prices} />
              <FundsDetails title="Multisigs's Holdings & Allowances from Treasury" funds={totalMultisigs} prices={prices} />
              <FundsDetails title="In Treasury Contract" funds={treasury} prices={prices} />
              <FundsDetails title="In Anchor Reserves" funds={anchorReserves} prices={prices} />
              <FundsDetails title="Reserved For Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="Kept in the Bonds Manager" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="TWG on Ethereum" funds={TWGfunds} prices={prices} />
              <FundsDetails title="TWG on Fantom" funds={TWGFtmfunds} prices={prices} />
              {
                polsFunds.map(p => {
                  return <FundsDetails title={p.title} funds={p.funds} prices={prices} />
                })
              }
            </SimpleGrid>
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
