import Layout from '@app/components/common/Layout';
import Link from '@app/components/common/Link';
import { AppNav } from '@app/components/common/Navbar';
import { Flex, Text, Image } from '@chakra-ui/react'
import Head from 'next/head';

export const AboutFirm = () => {

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - About FiRM</title>
        <meta name="og:title" content="Inverse Finance - About FiRM" />
        <meta name="description" content="Everything you need to know about FiRM, Inverse Finance's Fixed Rate Market, that introduces the DOLA Borrowing Rights token DBR and solves major DeFi issues. Rethink the way you borrow!" />
        <meta name="og:description" content="Everything you need to know about FiRM, Inverse Finance's Fixed Rate Market, that introduces the DOLA Borrowing Rights token DBR and solves major DeFi issues. Rethink the way you borrow!" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/everything-about-firm.png" />
        <meta name="keywords" content="Inverse Finance, FiRM, Fixed Rate, Fixed Rate Market, DOLA Borrowing Right, DBR, DeFi, DOLA, Personal Collateral Escrow, PCE, Borrowing, stablecoin, DAO, fixed rate DeFi, fixed rate loans, fixed rate lending, fixed rate borrowing" />
      </Head>
      <AppNav active="INV" />
      <Flex
        // bg={`url(/assets/social-previews/everything-about-firm.png)`}
        bgSize="cover"
        bgPosition="0 -50px"
        maxW="100vw"
        direction="column"
        w={{ base: 'full' }}
        alignItems="center"
        h="100vh"
        pt="10"
      >
        <Text as="h1" fontSize="40px" fontWeight="extrabold">
          Everything you need to know about FiRM!
        </Text>
        <Text color="secondaryTextColor" as="h2" fontSize="20px" fontWeight="bold">
          Inverse Finance's Fixed Rate Market
        </Text>
        <Link isExternal target="_blank" transition="all 500ms" _hover={{ transform: 'scale(1.1)' }} mt="10" href="/assets/firm/FiRM-Infographic.pdf">
          <Image cursor="pointer" borderRadius="50px" src="/assets/firm/firm2.png" w="500px" />
        </Link>
        <Link as="a" color="mainTextColor" isExternal target="_blank" transition="all 500ms" _hover={{ transform: 'scale(1.1)' }} fontSize="22px" mt="10" textDecoration="underline" href="/assets/firm/FiRM-Infographic.pdf">
          Download the FiRM Infographic
        </Link>
      </Flex>
    </Layout>
  )
}

export default AboutFirm