import { Flex, Text, VStack, SimpleGrid, Box, HStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import Link from '@app/components/common/Link';
import Container from '@app/components/common/Container';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const MAIN_LINKS = [
    { label: 'DOLA Payroll', href: '/governance/payroll', description: 'Manage DOLA payroll operations' },
    { label: 'INV Vester', href: '/governance/vester', description: 'INV token vesting management' },
    { label: 'Tx Refunds (TWG)', href: '/governance/refunds', description: 'Transaction refunds for TWG' },
    { label: 'FiRM markets UI admin', href: '/firm/admin', description: 'FiRM markets administration panel' },
    { label: 'Create a proposal draft', href: '/governance/propose?proposalLinkData=%7B"title"%3A"Draft"%2C"description"%3A"Forum+post+link,+Draft+content"%2C"actions"%3A%5B%5D%7D#', description: 'Create an empty proposal draft' },
]

const AFFILIATES_LINKS = [
    { label: 'Affiliates list', href: '/affiliate/list', description: 'View all affiliate applications and statuses' },
    { label: 'Affiliates form', href: '/affiliate/register', description: 'Form page to register as a new affiliate' },
    { label: 'Affiliates program page', href: '/affiliate/apply', description: 'Details, terms and conditions of the program' },
    { label: 'Affiliates dashboard', href: '/affiliate/dashboard', description: 'Personal affiliate dashboard and analytics' },
]

const LinkCard = ({ label, href, description }: { label: string, href: string, description: string }) => {
    return (
        <Box
            as={Link}
            href={href}
            p={6}
            borderRadius={8}
            border="1px solid"
            borderColor="divider"
            bg="containerContentBackground"
            _hover={{
                borderColor: "secondary",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            transition="all 0.2s"
            cursor="pointer"
            h="full"
        >
            <VStack alignItems="flex-start" spacing={2}>
                <HStack spacing={2} w="full" justify="space-between">
                    <Text fontSize="18px" fontWeight="bold" color="mainTextColor">
                        {label}
                    </Text>
                    <ExternalLinkIcon color="secondaryTextColor" boxSize={4} />
                </HStack>
                <Text fontSize="14px" color="secondaryTextColor" lineHeight="1.5">
                    {description}
                </Text>
            </VStack>
        </Box>
    )
}

export const TokensPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Team Portal</title>
                <meta name="og:title" content="Inverse Finance - Team Portal" />
            </Head>
            <AppNav active="Governance" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4', md: '6' }} maxWidth="1200px" mx="auto">
                <VStack alignItems="flex-start" spacing={4} w="full">
                    <VStack alignItems="flex-start" spacing={2}>
                        <Text fontSize="32px" fontWeight="extrabold" color="mainTextColor">
                            Team Portal
                        </Text>
                    </VStack>

                    <Container
                        label="Main Tools"
                        description="Essential tools for team operations"
                        w="full"
                        noPadding
                        p="0"
                        contentProps={{ p: 0 }}
                    >
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} p={6}>
                            {MAIN_LINKS.map((link, index) => (
                                <LinkCard
                                    key={index}
                                    label={link.label}
                                    href={link.href}
                                    description={link.description}
                                />
                            ))}
                        </SimpleGrid>
                    </Container>

                    <Container
                        label="Affiliate Links"
                        description="Manage and access affiliate program resources"
                        w="full"
                        noPadding
                        p="0"
                        contentProps={{ p: 0 }}
                    >
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} p={6}>
                            {AFFILIATES_LINKS.map((link, index) => (
                                <LinkCard
                                    key={index}
                                    label={link.label}
                                    href={link.href}
                                    description={link.description}
                                />
                            ))}
                        </SimpleGrid>
                    </Container>
                </VStack>
            </Flex>
        </Layout>
    )
}

export default TokensPage