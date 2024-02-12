import Container from '@app/components/common/Container';
import Layout from '@app/components/common/Layout';
import Link from '@app/components/common/Link';
import { AppNav } from '@app/components/common/Navbar';
import { VStack } from '@chakra-ui/react'
import Head from 'next/head';

export const AboutFirm = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Audits</title>
                <meta name="og:title" content="Inverse Finance - Audits" />
                <meta name="description" content="Inverse Finance audits" />
                <meta name="og:description" content="Inverse Finance audits" />
                <meta name="keywords" content="Inverse Finance, audits, code4rena, nomoi" />
                <meta name="twitter:image:alt" content="" />
                <meta name="twitter:site" content="" />
                <meta name="twitter:image:alt" content="" />
                <meta property="twitter:card" content="" />
            </Head>
            <AppNav active="More" activeSubmenu="Audits" />
            <VStack alignItems="flex-start" w='full'>
                <Container
                    label="FiRM & sDOLA audits"
                    description="Go to the audits documentation page"
                    href="https://docs.inverse.finance/inverse-finance/technical/audits"
                >
                    <VStack spacing="2" alignItems="flex-start">
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="/audits/sDOLA-yAudit.pdf" isExternal target="_blank">
                            sDOLA, by yAudit, Jan 23th, 2024
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="/audits/firm-nomoi.pdf" isExternal target="_blank">
                            Firm, by Nomoi, May 11th, 2023
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://code4rena.com/reports/2022-10-inverse/" isExternal target="_blank">
                            Firm, by Code4rena, December 20th, 2022
                        </Link>
                    </VStack>
                </Container>
                <Container
                    label="FiRM bug bounty programs"
                >
                    <VStack spacing="2" alignItems="flex-start">
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://immunefi.com/bounty/inversefinance/" isExternal target="_blank">
                            By Immunefi, live since Nov 30th, 2023
                        </Link>
                    </VStack>
                </Container>
                <Container
                    label="Safety score and other audits"
                >
                    <VStack spacing="2" alignItems="flex-start">
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://defisafety.com/app/pqrs/567" isExternal target="_blank">
                            DefiSafety score: 87% (Oct 23th, 2023)
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://defisafety.com/app/pqrs/199" isExternal target="_blank">
                            DefiSafety score: 87% (Feb 27th, 2023)
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/technical/audits" isExternal target="_blank">
                            Peckshield and Defimoon
                        </Link>
                    </VStack>
                </Container>
            </VStack>
        </Layout>
    )
}

export default AboutFirm