import { Flex, HStack, Link, Tabs, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { useDBR } from '@app/hooks/useDBR'
import { DbrSpenders } from '@app/components/F2/liquidations/dbr-spenders'
import { DBRFlowChart } from '@app/components/Transparency/DBRFlowChart'
import { shortenNumber } from '@app/util/markets'
import { useState } from 'react'
import { NavButtons } from '@app/components/common/Button'

const { TOKENS, TREASURY, DBR } = getNetworkConfigConstants(NetworkIds.mainnet);

export const DBRTransparency = () => {
    const { totalSupply, operator, totalDueTokensAccrued, price } = useDBR();
    const [tab, setTab] = useState('Spenders');

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency DBR</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="DBR Transparency" />
                <meta name="description" content="DBR Transparency" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-dbr.png" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dbr, dola, supply" />
            </Head>
            <AppNav active="Learn" activeSubmenu="Transparency Portal" />
            <TransparencyTabs active="dbr" />
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2" maxW='1200px'>
                <VStack w={{ base: 'full', xl: '850px' }}>
                    <DBRFlowChart operator={operator || TREASURY} />
                    <VStack spacing="0" w='full'>
                        <VStack maxW='600px' w='full'>
                            <NavButtons onClick={setTab} active={tab} options={['Spenders', 'Replenishments']} />
                        </VStack>
                        {
                            tab === 'Spenders' ? <DbrSpenders /> : null
                        }
                    </VStack>
                </VStack>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: '350px' }}>
                    <ShrinkableInfoMessage
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Text>DBR stands for DOLA Borrowing Right</Text>
                                <Text>1 DBR gives the right to borrow 1 DOLA for 1 year</Text>
                                <HStack w='full' justify="space-between">
                                    <Text>Current DBR price: </Text>
                                    <Text>{shortenNumber(price, 4, true)}</Text>
                                </HStack>
                            </VStack>
                        }
                    />
                    <SupplyInfos token={TOKENS[DBR]} supplies={[
                        { chainId: NetworkIds.mainnet, supply: totalSupply },
                    ]}
                    />
                    <ShrinkableInfoMessage
                        title="💸&nbsp;&nbsp;DBR Emissions"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/governance/proposals/mills/75" isExternal target="_blank">
                                    See initial emission of 4,646,000 for FiRM launch
                                </Link>
                                <Text>
                                    There is no max supply
                                </Text>
                                <Text>
                                    Future emissions to be voted by Governance
                                </Text>
                            </VStack>
                        }
                    />
                    <ShrinkableInfoMessage
                        title="⚡&nbsp;&nbsp;Roles & Powers"
                        description={
                            <>
                                <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- DBR operator:</Text>
                                    <Text>Add/remove DBR minters, mint</Text>
                                </Flex>
                                {/* <Flex direction="row" w='full' justify="space-between">
                                    <Text fontWeight="bold">- Controller:</Text>
                                    <Text>A contract whitelisting contracts that can borrow</Text>
                                </Flex> */}
                            </>
                        }
                    />
                    <ShrinkableInfoMessage
                        title="🗄️&nbsp;&nbsp;Docs & Media"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights" isExternal target="_blank">
                                    DBR documentation
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/whitepaper" isExternal target="_blank">
                                    FiRM whitepaper
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/about-firm" isExternal target="_blank">
                                    FiRM infographic
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.youtube.com/watch?v=RUgJQ5HOp2Y" isExternal target="_blank">
                                    FiRM introduction video (~1min)
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.youtube.com/watch?v=gAcp1YiuGkg" isExternal target="_blank">
                                    FiRM explainer video (~11min)
                                </Link>
                            </VStack>
                        }
                    />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default DBRTransparency
