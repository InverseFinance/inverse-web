import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { Text, Image, HStack, SimpleGrid, Stack, Flex, useMediaQuery } from "@chakra-ui/react";
import Container from "../common/Container";
import { shortenNumber } from "@app/util/markets";
import { TOKEN_IMAGES } from "@app/variables/images";
import { SkeletonBlob } from "../common/Skeleton";
import { SplashedText } from "../common/SplashedText";
import { useAppTheme } from "@app/hooks/useAppTheme";
import Table from "../common/Table";

const projectImages = {
    'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
    'Aave V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
    'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
    'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
    'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
}

const ProjectToken = ({ project, borrowToken, isMobile = false }: { project: string }) => {
    const _borrowToken = borrowToken || (project === 'FiRM' ? 'DOLA' : 'USDC')
    return <HStack spacing='4'>
        <Image borderRadius="50px" src={TOKEN_IMAGES[_borrowToken]} h={isMobile ? '20px' : '40px'} />
        <Text fontWeight="extrabold" fontSize={isMobile ? '16px' : '24px'}>
            {_borrowToken}
        </Text>
    </HStack>
}

const CollateralToken = ({ collateral, isMobile = false }: { project: string }) => {
    return <HStack spacing='4'>
        <Text fontWeight="extrabold" fontSize={isMobile ? '16px' : '24px'}>
            {collateral}
        </Text>
    </HStack>
}

const Project = ({ project }: { project: string }) => {
    return <HStack spacing='4'>
        <Image borderRadius='40px' src={projectImages[project]} h='40px' />
        <Text fontWeight="extrabold" fontSize="24px" textTransform="capitalize">
            {project}
        </Text>
    </HStack>
}

const RateType = ({ type, isMobile = false }: { type: string, isMobile: boolean }) => {
    const { themeStyles } = useAppTheme();
    const fontSize = isMobile ? '16px' : '24px';
    return <HStack spacing="0">
        <Text zIndex="9" fontWeight="extrabold" fontSize={fontSize} color={type === 'fixed' ? 'success' : 'warning'} textTransform="capitalize">
            {type}
        </Text>
        {
            type === 'fixed' && <SplashedText
                containerProps={{ alignItems: 'flex-start', spacing: '0', h: isMobile ? '20px' : '40px' }}
                fontWeight="extrabold"
                fontSize={fontSize}
                color={'success'}
                textTransform="capitalize"
                splashColor={`${themeStyles?.colors.success}`}
                lineHeight='1'
                h={isMobile ? '20px' : '40px'}
                splashProps={{
                    top: isMobile ? '17px' : '34px',
                    left: isMobile ? '-60px' : '-80px',
                    w: isMobile ? '70px' : '110px',
                    opacity: 0.8,
                    h: isMobile ? '5px' : '10px',
                }}
            ></SplashedText>
        }
    </HStack>
}

const RateListItem = ({ project, borrowRate, borrowToken, collateral, type }) => {
    return <>
        <Project project={project} />
        <CollateralToken project={project} collateral={collateral || 'Misc'} />
        <Text fontWeight="extrabold" fontSize="24px">
            {borrowRate ? shortenNumber(borrowRate, 2) + '%' : '-'}
        </Text>
        <ProjectToken project={project} borrowToken={borrowToken} />
        <RateType type={type} />
    </>
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontWeight="extrabold" fontSize="16px" {...props} />
}

const columns = [
    {
        field: 'project',
        label: 'Project',
        header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
        value: ({ project }) => {
            return <Cell minWidth="110px">
                <Cell minWidth='110px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
                    <Project project={project} />
                </Cell>
            </Cell>
        },
    },
    {
        field: 'collateral',
        label: 'Collateral',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ project, collateral }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CollateralToken isMobile={true} project={project} collateral={collateral || 'Misc'} />
            </Cell>
        },
    },
    {
        field: 'borrowRate',
        label: 'Borrow Rate',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ borrowRate }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CellText>~{shortenNumber(borrowRate, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'project',
        label: 'Borrow Token',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ project, borrowToken }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <ProjectToken project={project} isMobile={true} borrowToken={borrowToken} />
            </Cell>
        },
    },
    {
        field: 'type',
        label: 'Rate Type',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ type }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <RateType type={type} isMobile={true} />
            </Cell>
        },
    },
]

const mobileThreshold = 1000;

export const RateComparator = () => {
    const { data } = useCustomSWR('/api/dola/rate-comparator?v=7');
    const [isSmallerThan] = useMediaQuery(`(max-width: ${mobileThreshold}px)`);

    return <Container
        noPadding
        contentProps={{ p: { base: '2', sm: '8' } }}
        label="Borrow Rate Comparison"
        description="Accross major DeFi lending protocols on Ethereum for DOLA, USDC or DAI"
        contentBgColor="gradient3"
    >
        {
            data?.rates?.length && isSmallerThan && <Table
                keyName="project"
                pinnedItems={['FiRM']}
                pinnedLabels={['']}
                noDataMessage="Loading..."
                columns={columns}
                items={data?.rates}
                defaultSort={'borrowRate'}
                defaultSortDir="asc"
                enableMobileRender={true}
                mobileThreshold={mobileThreshold}
                showRowBorder={true}
                spacing="0"
            />
        }
        {
            !data?.rates?.length && isSmallerThan && <SkeletonBlob w='full' />
        }
        {
            !isSmallerThan && <SimpleGrid gap="4" w='full' columns={5}>
                <Text fontWeight="extrabold" fontSize="28px">
                    Project
                </Text>
                <Text fontWeight="extrabold" fontSize="28px">
                    Collateral
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
                        <SkeletonBlob w='full' />
                    </>
                }
                {
                    data?.rates.map((rate, i) => {
                        return <RateListItem key={rate.project} {...rate} />
                    })
                }
            </SimpleGrid>
        }
    </Container>
}