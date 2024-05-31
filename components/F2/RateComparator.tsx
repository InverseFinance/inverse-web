import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { Text, Image, HStack, SimpleGrid } from "@chakra-ui/react";
import Container from "../common/Container";
import { shortenNumber } from "@app/util/markets";
import { TOKEN_IMAGES } from "@app/variables/images";
import { SkeletonBlob } from "../common/Skeleton";
import { SplashedText } from "../common/SplashedText";
import { useAppTheme } from "@app/hooks/useAppTheme";

const projectImages = {
    'Aave V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
    'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
    'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
    'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
}

const RateListItem = ({ project, borrowRate, type }) => {
    const { themeStyles } = useAppTheme();
    const borrowToken = (project === 'FiRM' ? 'DOLA' : 'USDC')
    return <>
        <HStack spacing='4'>
            <Image borderRadius='40px' src={projectImages[project]} h='40px' />
            <Text fontWeight="extrabold" fontSize="24px" textTransform="capitalize">
                {project}
            </Text>
        </HStack>
        <Text fontWeight="extrabold" fontSize="24px">
            {borrowRate ? shortenNumber(borrowRate, 2) + '%' : '-'}
        </Text>
        <HStack spacing='4'>
            <Image src={TOKEN_IMAGES[borrowToken]} h='40px' />
            <Text fontWeight="extrabold" fontSize="24px" textTransform="capitalize">
                {borrowToken}
            </Text>
        </HStack>

        <HStack spacing="0">
            <Text zIndex="9" fontWeight="extrabold" fontSize="26px" color={type === 'fixed' ? 'success' : 'warning'} textTransform="capitalize">
                {type}
            </Text>
            {
                type === 'fixed' && <SplashedText
                    containerProps={{ alignItems: 'flex-start', spacing: '0', h: '40px' }}
                    fontWeight="extrabold" fontSize="24px" color={'success'}
                    textTransform="capitalize"
                    splashColor={`${themeStyles?.colors.success}`}
                    lineHeight='1'
                    h='40px'
                    splashProps={{
                        top: '34px',
                        left: '-80px',
                        w: '110px',
                        opacity: 0.8,
                        h: '10px',
                    }}
                ></SplashedText>
            }
        </HStack>
    </>
}

export const RateComparator = () => {
    const { data } = useCustomSWR('/api/dola/rate-comparator');

    return <Container
        noPadding
        contentProps={{ p: { base: '2', sm: '8' } }}
        label="Borrow Rate Comparator"
        description="Accross major DeFi lending protocols on Ethereum for DOLA & USDC"
        contentBgColor="gradient3"
    >
        <SimpleGrid gap="4" w='full' columns={4}>
            <Text fontWeight="extrabold" fontSize="28px">
                Project
            </Text>
            <Text fontWeight="extrabold" fontSize="28px">
                Borrow Rate
            </Text>
            <Text fontWeight="extrabold" fontSize="28px">
                Borrow Token
            </Text>
            <Text fontWeight="extrabold" fontSize="28px">
                Rate type
            </Text>
            {
                !data?.rates && <>
                    <SkeletonBlob w='full' />
                    <SkeletonBlob w='full' />
                    <SkeletonBlob w='full' />
                    <SkeletonBlob w='full' />
                </>
            }
            {
                data?.rates.map((rate, i) => {
                    return <RateListItem key={rate.project} {...rate} />
                })
            }
        </SimpleGrid>
    </Container>
}