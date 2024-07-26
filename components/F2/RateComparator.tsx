import { useCustomSWR } from "@app/hooks/useCustomSWR"
import { Text, Image, HStack, SimpleGrid, Stack, Flex, useMediaQuery, VStack, useDisclosure, Select, Box } from "@chakra-ui/react";
import Container from "../common/Container";
import { shortenNumber } from "@app/util/markets";
import { TOKEN_IMAGES } from "@app/variables/images";
import { SkeletonBlob } from "../common/Skeleton";
import { SplashedText } from "../common/SplashedText";
import { useAppTheme } from "@app/hooks/useAppTheme";
import Table from "../common/Table";
import Link from "../common/Link";
import { useRouter } from "next/router";
import { useDBRMarkets } from "@app/hooks/useDBR";
import { SettingsIcon } from "@chakra-ui/icons";
import InfoModal from "../common/Modal/InfoModal";
import { Input } from "../common/Input";
import { useEffect, useState } from "react";

const projectImages = {
    'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
    'Curve': 'https://icons.llamao.fi/icons/protocols/curve?w=48&h=48',
    'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
    'Silo': 'https://icons.llamao.fi/icons/protocols/silo?w=48&h=48',
    'Compound': 'https://icons.llamao.fi/icons/protocols/compound?w=48&h=48',
    'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
    'Spark': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
}

const projectCollaterals = {
    'Frax': ['WETH', 'WBTC', 'sfrxETH', 'FXS', 'CVX', 'CRV', 'wstETH', 'sFRAX'],
    'Curve': ['WETH', 'WBTC', 'wstETH'],
    'Aave-V3': ['WETH', 'WBTC', 'CRV', 'wstETH'],
    'Compound': ['WETH', 'WBTC', 'COMP', 'LINK', 'UNI'],
    'Spark': ['WETH', 'WBTC', 'wstETH', 'rETH'],
    'FiRM': [],
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
            {project.replace('-', ' ')}
        </Text>
    </HStack>
}

const RateType = ({ type, isMobile = false }: { type: string, isMobile: boolean }) => {
    const { themeStyles } = useAppTheme();
    const fontSize = isMobile ? '16px' : '26px';
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

const RateListItem = ({ fields, project, borrowRate, borrowToken, collateral, type }) => {
    const comps = {
        'project': <Project project={project} />,
        'collateral': <CollateralToken project={project} collateral={collateral || 'Multiple'} />,
        'borrowRate': <Text fontWeight="extrabold" fontSize="24px">
            {borrowRate ? shortenNumber(borrowRate, 2) + '%' : '-'}
        </Text>,
        'borrowToken': <ProjectToken project={project} borrowToken={borrowToken} />,
        'type': <RateType type={type} />,
    }
    return <>
        {
            fields.map(f => {
                return comps[f];
            })
        }
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
                <CollateralToken isMobile={true} project={project} collateral={collateral || 'Multiple'} />
            </Cell>
        },
    },
    {
        field: 'borrowRate',
        label: 'Borrow APY',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ borrowRate }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CellText>~{shortenNumber(borrowRate, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'borrowToken',
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

const FIELDS = columns.reduce((prev, curr) => ({ ...prev, [curr.field]: curr.label }), {});
const defaultFields = columns.map(c => c.field);
const defaultProjects = Object.keys(projectCollaterals);

export const RateComparator = () => {
    const { query } = useRouter();
    const [fieldsText, setFieldsText] = useState(defaultFields.join(','));
    const [fields, setFields] = useState(defaultFields);
    const [collateralFilter, setCollateralFilter] = useState('');
    const [includeProjectsText, setIncludeProjectsText] = useState(defaultProjects.join(','));
    const [includeProjects, setIncludeProjects] = useState(defaultProjects);
    const [excludeText, setExcludeText] = useState('');
    const [exclude, setExclude] = useState([]);
    const [initedQuery, setInitedQuery] = useState(false);
    
    const excludeProject = ((query?.excludeProject?.split(',')) || []).map(e => e.toLowerCase());
    const { markets } = useDBRMarkets();
    const { data } = useCustomSWR('/api/dola/rate-comparator?v=1.1.2');
    const [isSmallerThan] = useMediaQuery(`(max-width: ${mobileThreshold}px)`);
    const { onOpen, onClose, isOpen } = useDisclosure();

    projectCollaterals['FiRM'] = markets?.filter(m => !m.borrowPaused).map(m => m.underlying.symbol)

    useEffect(() => {
        if(!query?.collateral || initedQuery) return
        setCollateralFilter(query.collateral);
        setInitedQuery(true);
    }, [query, initedQuery]);

    const rates = (data?.rates?.filter(r => !!r.borrowRate) || [])
        .filter(r => !exclude.includes(r.key.toLowerCase()))
        .filter(r => !excludeProject.includes(r.project.toLowerCase()))
        .filter(r => includeProjects.includes(r.project))
        .filter(r => !collateralFilter || (!!collateralFilter && (r.collateral.replace(/^ETH$/, 'WETH') === collateralFilter || (r.collateral === 'Multiple' && projectCollaterals[r.project].includes(collateralFilter.replace(/^ETH$/, 'WETH'))))))
        .map(r => !collateralFilter ? r : ({ ...r, collateral: collateralFilter }))

    const { themeStyles } = useAppTheme();

    const openSettings = () => {
        onOpen();
    }

    const handleFieldsChange = (value: string) => {
        setFieldsText(value);
        setFields((value.replace(/\s+/, '').split(',').filter(c => defaultFields.includes(c))) || defaultFields);
    }

    const handleIncludeProjects = (value: string) => {
        setIncludeProjectsText(value);
        setIncludeProjects((value.replace(/\s+/, '').split(',').filter(c => defaultProjects.includes(c))) || defaultProjects);
    }

    const handleExclude = (value: string) => {
        setExcludeText(value);
        setExclude(value.toLowerCase().split(','));
    }

    return <Container
        noPadding
        p='0'
        contentProps={{ p: { base: '2', sm: '8' }, direction: 'column' }}
        label="Stablecoin Borrow Rate Comparison"
        description="Across major DeFi lending protocols on Ethereum"
        contentBgColor="gradient3"
        right={
            <SettingsIcon _hover={{ filter: 'brightness(1.2)' }} cursor="pointer" onClick={() => openSettings()} color="mainTextColor" fontSize={40} />
        }
    >
        <InfoModal title="Filter & Customize" onOk={onClose} isOpen={isOpen} onClose={onClose} minW='800px'>
            <VStack spacing="4" alignItems="flex-start" p="4" w='full'>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">Columns:</Text>
                        <Text onClick={() => handleFieldsChange(defaultFields.join(','))} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Input textAlign="left" value={fieldsText} onChange={(e) => handleFieldsChange(e.target.value)} />
                </VStack>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">Filter by collateral:</Text>
                        <Text onClick={() => setCollateralFilter('')} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Select value={collateralFilter} fontWeight="500" fontSize="18px" h="48px" bgColor="mainBackgroundColor" onChange={(v) => setCollateralFilter(v.target.value)}>
                        <option style={{ paddingLeft: '74px' }}>All</option>
                        {
                            projectCollaterals['FiRM'].map(c => {
                                return <option key={c} value={c}>{c === 'DAI' ? 'DAI (sDAI)' : c}</option>
                            })
                        }
                    </Select>
                </VStack>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">Include projects:</Text>
                        <Text onClick={() => handleIncludeProjects(defaultProjects.join(','))} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Input textAlign="left" value={includeProjectsText} onChange={(e) => handleIncludeProjects(e.target.value)} />
                </VStack>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">
                            Exclude specific items:
                        </Text>
                        <Text onClick={() => handleExclude('')} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Input textAlign="left" value={excludeText} onChange={(e) => handleExclude(e.target.value)} />
                    <Box>
                        <Text fontWeight="bold">Click an item to exclude it:</Text>
                        {
                            data?.rates.filter(r => !exclude.includes(r.key.toLowerCase())).map(r => {
                                return <Text onClick={() => handleExclude([...exclude, r.key].filter(e => !!e).join(','))} textDecoration="underline" cursor="pointer" mr="2" display="inline-block" key={r.key}>{r.key}</Text>
                            })
                        }
                    </Box>
                </VStack>
            </VStack>
        </InfoModal>
        {
            rates.length > 0 && isSmallerThan && <Table
                keyName="key"
                pinnedItems={['FiRM-multiple-DOLA']}
                pinnedLabels={['']}
                noDataMessage="Loading..."
                columns={columns}
                items={rates}
                defaultSort={'borrowRate'}
                defaultSortDir="asc"
                enableMobileRender={true}
                mobileThreshold={mobileThreshold}
                showRowBorder={true}
                spacing="0"
                onClick={(item) => {
                    window.open(item.link, '_blank')
                }}
                mobileClickBtnLabel="View Market"
            />
        }
        {
            !rates.length && isSmallerThan && <SkeletonBlob w='full' />
        }
        {
            !isSmallerThan && <>
                <SimpleGrid gap="5" width={`${fields.length * 250}px`} columns={fields.length}>
                    {
                        fields.map(f => {
                            return <Text key={f} fontWeight="extrabold" fontSize="28px">
                                {FIELDS[f]}
                            </Text>
                        })
                    }
                    {
                        !rates?.length && <>
                            {
                                fields.map(f => {
                                    return <SkeletonBlob key={f} w='full' />
                                })
                            }
                        </>
                    }
                </SimpleGrid>
                <VStack pt='5' spacing="0" >
                    {
                        rates.map((rate, i) => {
                            return <Link borderBottom="1px solid transparent" borderTop={`1px solid ${themeStyles.colors.mainTextColorAlpha}`} py="2" transition="200 ms all" _hover={{ borderY: `1px solid ${themeStyles.colors.mainTextColor}` }} w='full' isExternal target="_blank" href={rate.link} key={rate.key}>
                                <SimpleGrid gap="5" width={`${fields.length * 250}px`} columns={fields.length}>
                                    <RateListItem fields={fields} {...rate} />
                                </SimpleGrid>
                            </Link>
                        })
                    }
                </VStack>
            </>
        }
    </Container>
}