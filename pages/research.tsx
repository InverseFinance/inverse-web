import Container from '@app/components/common/Container';
import Layout from '@app/components/common/Layout';
import Link from '@app/components/common/Link';
import { AppNav } from '@app/components/common/Navbar';
import { EditIcon, SearchIcon } from '@chakra-ui/icons';
import { VStack } from '@chakra-ui/react'
import Head from 'next/head';

export const AboutFirm = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Research</title>
                <meta name="og:title" content="Inverse Finance - Research" />
                <meta name="description" content="Inverse Finance audits" />
                <meta name="og:description" content="Inverse Finance audits" />
                <meta name="keywords" content="Inverse Finance, audits, code4rena, nomoi" />
                <meta name="twitter:image:alt" content="" />
                <meta name="twitter:site" content="" />
                <meta name="twitter:image:alt" content="" />
                <meta property="twitter:card" content="" />
            </Head>
            <AppNav active="More" activeSubmenu="Research" />
            <VStack alignItems="flex-start" w='full'>
                <Container
                    label="Research papers and articles"
                >
                    <VStack spacing="2" alignItems="flex-start">
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="/whitepaper" isExternal target="_blank">
                            <EditIcon mr="2" />FiRM whitepaper
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="/whitepaper/sDOLA" isExternal target="_blank">
                            <EditIcon mr="2" />sDOLA whitepaper
                        </Link>
                        <Link color="mainTextColor" fontSize="20px" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" href="https://revelointel.com/industry-intel/inverse/" isExternal target="_blank">
                            <SearchIcon mr="2" />Analyst coverage by Revolo Intel
                        </Link>
                    </VStack>
                </Container>                
            </VStack>
        </Layout>
    )
}

export default AboutFirm