import { useStakedDola } from "@app/util/dola-staking";
import { useStakedJDola } from "@app/util/junior";
import { Divider, VStack, Text, SimpleGrid } from "@chakra-ui/react";
import { Link } from "../common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";

export const JuniorMessage = () => {
    const { apy: sDolaApy, isLoading: sDolaLoading } = useStakedDola();
    const { apy, isLoading: jrDolaLoading } = useStakedJDola();

    const totalJrDolaApy = apy + sDolaApy;

    if (jrDolaLoading || sDolaLoading) {
        return null
    }

    return <VStack w='full' alignItems="center" mb="4" spacing="0" px="6">
        <Text fontSize={{ base: '16px', md: '24px' }} fontWeight="bold">
            Introducing the Junior Tranche: First-Loss Insurance for DOLA
        </Text>
        <SimpleGrid w='full' columns={{ base: 1, lg: 2 }} spacingY={{ base: 1, md: 0 }} spacingX="8">
            <Text textAlign={{ base: 'left', md: 'right' }} fontSize={{ base: '12px', md: '16px' }}><b style={{ fontSize: { base: '20px', md: '30px' }, verticalAlign: 'middle', marginRight: '4px' }}>🛡️</b> <b>For FiRM</b>: this adds a new <b>safety</b> layer to the protocol</Text>
            <Text fontSize={{ base: '12px', md: '16px' }}><b style={{ fontSize: { base: '20px', md: '30px' }, verticalAlign: 'middle', marginRight: '4px' }}>💸</b> <b>For yield lovers</b>: this adds a new <b>high-yield</b> opportunity</Text>
            <Link textAlign={{ base: 'left', md: 'right' }} fontSize={{ base: '12px', md: '16px' }} textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/jrdola" isExternal target="_blank">Learn more about jrDOLA <ExternalLinkIcon /></Link>
            <Link  fontSize={{ base: '12px', md: '16px' }} textDecoration="underline" href="/jrDOLA">
                Get <b style={{ color: 'var(--chakra-colors-accentTextColor)' }}>{totalJrDolaApy.toFixed(2)}% APY</b> with jrDOLA
            </Link>
        </SimpleGrid>
        <Divider pt="4" w='full' maxW="1200px" />
    </VStack>
}