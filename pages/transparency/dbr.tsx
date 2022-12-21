import { Flex, Link, Text, VStack } from '@chakra-ui/react'

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

const { TOKENS, TREASURY, DBR } = getNetworkConfigConstants(NetworkIds.mainnet);

export const DBRTransparency = () => {
    const { totalSupply, operator, totalDueTokensAccrued, price } = useDBR();

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
                    <DbrSpenders />
                </VStack>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: '350px' }}>
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
                                    No future emission planned at the moment.
                                </Text>
                                <Text>
                                    To be voted via Governance.
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
                        title="🗄️&nbsp;&nbsp;Docs"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights" isExternal target="_blank">
                                    DBR documentation
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/whitepaper" isExternal target="_blank">
                                    FiRM whitepaper
                                </Link>
                                <Link textDecoration="underline" color="secondaryTextColor" href="https://www.inverse.finance/about-firm" isExternal target="_blank">
                                    FiRM Infographic
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
