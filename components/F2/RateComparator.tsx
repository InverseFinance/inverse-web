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
import { useDBRMarkets } from "@app/hooks/useDBR";
import { SettingsIcon } from "@chakra-ui/icons";
import InfoModal from "../common/Modal/InfoModal";
import { Input } from "../common/Input";
import { lightTheme } from '@app/variables/theme'
import { useState } from "react";

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
    'Frax': ['WETH', 'WBTC', 'sfrxETH', 'FXS', 'CVX', 'CRV', 'wstETH', 'sFRAX', 'sUSDe'],
    'Curve': ['WETH', 'WBTC', 'wstETH'],
    'Aave-V3': ['WETH', 'WBTC', 'CRV', 'wstETH'],
    'Compound': ['WETH', 'WBTC', 'COMP', 'LINK', 'UNI'],
    'Spark': ['WETH', 'WBTC', 'wstETH', 'rETH'],
    'FiRM': [],
}

const ProjectToken = ({ project, borrowToken, isMobile = false, themeStyles }: { project: string }) => {
    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles;
    const _borrowToken = borrowToken || (project === 'FiRM' ? 'DOLA' : 'USDC')
    return <HStack spacing='4'>
        <Image borderRadius="50px" src={TOKEN_IMAGES[_borrowToken]} h={isMobile ? '20px' : '40px'} />
        <Text color={_themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={isMobile ? '16px' : '24px'}>
            {_borrowToken}
        </Text>
    </HStack>
}

const CollateralToken = ({ collateral, isMobile = false, themeStyles }: { project: string }) => {
    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles;
    return <HStack spacing='4'>
        <Text color={_themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={isMobile ? '16px' : '24px'}>
            {collateral}
        </Text>
    </HStack>
}

const Project = ({ project, themeStyles }: { project: string }) => {
    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles;
    return <HStack spacing='4'>
        {
            !project ? <Text color={_themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize="24px" textTransform="capitalize">
                -
            </Text> : <>
                <Image borderRadius='40px' src={projectImages[project]} h='40px' />
                <Text color={_themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize="24px" textTransform="capitalize">
                    {project.replace('-', ' ')}
                </Text>
            </>
        }
    </HStack>
}

const RateType = ({ type, isMobile = false, themeStyles }: { type: string, isMobile: boolean }) => {
    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles;
    const fontSize = isMobile ? '16px' : '26px';
    return <HStack spacing="0">
        <Text zIndex="9" fontWeight="extrabold" fontSize={fontSize} color={type === 'fixed' ? _themeStyles.colors.success : _themeStyles.colors.warning} textTransform="capitalize">
            {type}
        </Text>
        {
            type === 'fixed' && <SplashedText
                containerProps={{ alignItems: 'flex-start', spacing: '0', h: isMobile ? '20px' : '40px' }}
                fontWeight="extrabold"
                fontSize={fontSize}
                color={_themeStyles.colors.success}
                textTransform="capitalize"
                splashColor={`${_themeStyles?.colors.success}`}
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

const RateListItem = ({ fields, project, borrowRate, borrowToken, collateral, type, hasLeverage, themeStyles }) => {
    const comps = {
        'project': <Project project={project} themeStyles={themeStyles} />,
        'collateral': <CollateralToken collateral={collateral || 'Multiple'} themeStyles={themeStyles} />,
        'borrowRate': <Text fontWeight="extrabold" fontSize="24px" color={themeStyles.colors.mainTextColor}>
            {borrowRate ? shortenNumber(borrowRate, 2) + '%' : '-'}
        </Text>,
        'borrowToken': <ProjectToken project={project} borrowToken={borrowToken} themeStyles={themeStyles} />,
        'hasLeverage': <Text fontWeight="extrabold" fontSize="24px" color={hasLeverage ? themeStyles.colors.success : themeStyles.colors.mainTextColor}>
            {hasLeverage ? 'Yes' : 'No'}
        </Text>,
        'type': <RateType type={type} themeStyles={themeStyles} />,
    }
    return <>
        {
            fields.map(f => {
                return comps[f];
            })
        }
    </>
}

const GroupedRateListItem = ({ fields, bestCompetitorProject, firmRate, bestCompetitorRate, collateral, themeStyles }) => {
    const comps = {
        'bestCompetitorProject': <Project project={bestCompetitorProject} themeStyles={themeStyles} />,
        'collateral': <CollateralToken collateral={collateral || 'Multiple'} themeStyles={themeStyles} />,
        'firmRate': <Text color={firmRate <= bestCompetitorRate ? themeStyles.colors.success : themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize="24px">
            {firmRate ? shortenNumber(firmRate, 2) + '%' : '-'}
        </Text>,
        'bestCompetitorRate': <Text color={bestCompetitorRate <= firmRate ? themeStyles.colors.success : themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize="24px">
            {bestCompetitorRate && bestCompetitorRate < Infinity ? shortenNumber(bestCompetitorRate, 2) + `% (${bestCompetitorProject})` : '-'}
        </Text>,
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
        label: 'Stablecoin',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ project, borrowToken }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <ProjectToken project={project} isMobile={true} borrowToken={borrowToken} />
            </Cell>
        },
    },
    {
        field: 'hasLeverage',
        label: 'Has Leverage',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ hasLeverage }) => {
            return <Cell fontWeight="bold" color={hasLeverage ? 'success' : undefined} minWidth="70px" alignItems="center" justify="center" >
                {hasLeverage ? 'Yes' : 'No'}
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
const GROUPED_FIELDS = {
    'collateral': 'Collateral',
    'firmRate': "FiRM's fixed-rate",
    'bestCompetitorRate': "Competitor's variable-rate",
    'bestCompetitorProject': 'Competitor',
};
const defaultFields = columns.map(c => c.field);
const defaultProjects = Object.keys(projectCollaterals);
const defaultGroupedFields = ['collateral', 'firmRate', 'bestCompetitorRate'];

const UngroupedComparator = ({ allRates, themeStyles, isSmallerThan = false, showLabel = true, collateralFilterFunction }) => {
    const [fieldsText, setFieldsText] = useState(defaultFields.join(','));
    const [fields, setFields] = useState(defaultFields);
    const [collateralFilter, setCollateralFilter] = useState('');
    const [includeProjectsText, setIncludeProjectsText] = useState(defaultProjects.join(','));
    const [includeProjects, setIncludeProjects] = useState(defaultProjects);
    const [excludeText, setExcludeText] = useState('');
    const [exclude, setExclude] = useState([]);
    const { onOpen, onClose, isOpen } = useDisclosure();

    const projectRates = (allRates?.filter(r => !!r.borrowRate) || [])
        .filter(r => !exclude.includes(r.key.toLowerCase()))
        .filter(r => includeProjects.includes(r.project));

    const rates = projectRates.filter(r => collateralFilterFunction(r, collateralFilter))
        .map(r => !collateralFilter ? r : ({ ...r, collateral: collateralFilter }))

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
        contentProps={{ p: { base: '0', sm: '8' }, direction: 'column' }}
        label={showLabel ? <Text fontSize="28px" fontWeight="extrabold">Stablecoin Borrow Rate Comparison</Text> : null}
        labelProps={showLabel ? { color: themeStyles.colors.mainTextColor } : null}
        description={showLabel ? "Across major DeFi lending protocols on Ethereum" : null}
        contentBgColor={themeStyles.colors.gradient3}
        descriptionProps={{ color: themeStyles.colors.mainTextColorLight }}
        right={
            <SettingsIcon _hover={{ filter: 'brightness(1.2)' }} cursor="pointer" onClick={() => openSettings()} color={showLabel ? themeStyles.colors.mainTextColor : themeStyles.colors.contrastMainTextColor} fontSize={40} />
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
                    <Select value={collateralFilter} fontWeight="500" fontSize="18px" h="48px" bgColor={themeStyles.colors.mainBackgroundColor} onChange={(v) => setCollateralFilter(v.target.value)}>
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
                            allRates?.filter(r => !exclude.includes(r.key.toLowerCase())).map(r => {
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
                defaultSort={'type'}
                secondarySortFields={['borrowRate']}
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
                <SimpleGrid gap="3" width={`${fields.length * 210}px`} columns={fields.length}>
                    {
                        fields.map(f => {
                            return <Text color={themeStyles.colors.mainTextColor} key={f} fontWeight="extrabold" fontSize="28px">
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
                                <SimpleGrid gap="3" width={`${fields.length * 210}px`} columns={fields.length}>
                                    <RateListItem fields={fields} {...rate} themeStyles={themeStyles} />
                                </SimpleGrid>
                            </Link>
                        })
                    }
                </VStack>
            </>
        }
    </Container>
}

const GroupedComparator = ({ allRates, themeStyles, isSmallerThan = false, showLabel = true, allCollaterals, collateralFilterFunction }) => {
    const [fieldsText, setFieldsText] = useState(defaultGroupedFields.join(','));
    const [fields, setFields] = useState(defaultGroupedFields);
    const [collateralFilter, setCollateralFilter] = useState('');
    const [includeProjectsText, setIncludeProjectsText] = useState(defaultProjects.join(','));
    const [includeProjects, setIncludeProjects] = useState(defaultProjects);
    const [excludeText, setExcludeText] = useState('');
    const [exclude, setExclude] = useState([]);
    const { onOpen, onClose, isOpen } = useDisclosure();

    const projectRates = (allRates?.filter(r => !!r.borrowRate) || [])
        .filter(r => !exclude.includes(r.key.toLowerCase()))
        .filter(r => includeProjects.includes(r.project));

    const openSettings = () => {
        onOpen();
    }

    const handleFieldsChange = (value: string) => {
        setFieldsText(value);
        setFields((value.replace(/\s+/, '').split(',').filter(c => defaultGroupedFields.includes(c))) || defaultGroupedFields);
    }

    const handleIncludeProjects = (value: string) => {
        setIncludeProjectsText(value);
        setIncludeProjects((value.replace(/\s+/, '').split(',').filter(c => defaultProjects.includes(c))) || defaultProjects);
    }

    const handleExclude = (value: string) => {
        setExcludeText(value);
        setExclude(value.toLowerCase().split(','));
    }

    const groupedRates = allCollaterals
        .filter(c => collateralFilterFunction({ collateral: c }, collateralFilter))
        .map(c => {
            const bestCompetitor = projectRates.filter(r => collateralFilterFunction(r, c)).filter(r => r.project !== 'FiRM').reduce((prev, curr) => (curr.borrowRate < prev.borrowRate ? curr : prev), { borrowRate: Infinity });
            return ({
                collateral: c,
                firmRate: projectRates.filter(r => collateralFilterFunction(r, c)).find(r => r.project === 'FiRM')?.borrowRate,
                bestCompetitorRate: bestCompetitor.borrowRate,
                bestCompetitorProject: bestCompetitor.project,
                bestCompetitorToken: bestCompetitor.borrowToken,
                bestCompetitorHasLeverage: bestCompetitor.hasLeverage,
                bestCompetitorType: bestCompetitor.type,
            })
        })
        .filter(r => !!r.firmRate && !!r.bestCompetitorRate && r.bestCompetitorRate < Infinity);
    groupedRates.sort((a, b) => a.bestCompetitorRate - b.bestCompetitorRate);

    const groupedRatesZone =
        <>
            <SimpleGrid gap="3" columns={fields.length}>
                {
                    fields.map(f => {
                        return <Text color={themeStyles.colors.mainTextColor} key={f} fontWeight="extrabold" fontSize="28px">
                            {GROUPED_FIELDS[f]}
                        </Text>
                    })
                }
                {
                    !groupedRates?.length && <>
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
                    groupedRates.map((rate, i) => {
                        return <Box borderBottom="1px solid transparent" borderTop={`1px solid ${themeStyles.colors.mainTextColorAlpha}`} py="2" transition="200 ms all" _hover={{ borderY: `1px solid ${themeStyles.colors.mainTextColor}` }} w='full' key={rate.collateral}>
                            <SimpleGrid gap="3" columns={fields.length}>
                                <GroupedRateListItem fields={fields} {...rate} themeStyles={themeStyles} />
                            </SimpleGrid>
                        </Box>
                    })
                }
            </VStack>
        </>

    return <Container
        noPadding
        p='0'
        contentProps={{ p: { base: '0', sm: '8' }, direction: 'column' }}
        label={showLabel ? <HStack spacing="1"><Text fontSize="28px" fontWeight="extrabold">Best Competitors Comparison</Text>{!fields.includes('firmRate') && <><Text fontSize="28px" fontWeight="extrabold"> - FiRM's fixed-rate:</Text><Text fontSize="28px" fontWeight="extrabold" color="success">{shortenNumber(groupedRates[0]?.firmRate, 2)}%</Text></>}</HStack> : null}
        labelProps={showLabel ? { color: themeStyles.colors.mainTextColor } : null}
        description={showLabel ? "Compare the best rate for each collateral between FiRM and competitors among Aave V3, Compound, Fraxlend, Spark and Curve." : null}
        contentBgColor={themeStyles.colors.gradient3}
        descriptionProps={{ color: themeStyles.colors.mainTextColorLight }}
        right={
            <SettingsIcon _hover={{ filter: 'brightness(1.2)' }} cursor="pointer" onClick={() => openSettings()} color={showLabel ? themeStyles.colors.mainTextColor : themeStyles.colors.contrastMainTextColor} fontSize={40} />
        }
    >
        <InfoModal title="Filter & Customize" onOk={onClose} isOpen={isOpen} onClose={onClose} minW='800px'>
            <VStack spacing="4" alignItems="flex-start" p="4" w='full'>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">Columns:</Text>
                        <Text onClick={() => handleFieldsChange(defaultGroupedFields.join(','))} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Input textAlign="left" value={fieldsText} onChange={(e) => handleFieldsChange(e.target.value)} />
                </VStack>
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize="20px" fontWeight="extrabold">Filter by collateral:</Text>
                        <Text onClick={() => setCollateralFilter('')} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Select value={collateralFilter} fontWeight="500" fontSize="18px" h="48px" bgColor={themeStyles.colors.mainBackgroundColor} onChange={(v) => setCollateralFilter(v.target.value)}>
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
                            allRates?.filter(r => !exclude.includes(r.key.toLowerCase())).map(r => {
                                return <Text onClick={() => handleExclude([...exclude, r.key].filter(e => !!e).join(','))} textDecoration="underline" cursor="pointer" mr="2" display="inline-block" key={r.key}>{r.key}</Text>
                            })
                        }
                    </Box>
                </VStack>
            </VStack>
        </InfoModal>
        {groupedRatesZone}
    </Container>
}

export const RateComparator = ({
    themeStyles,
    showLabel = true,
}) => {
    const { markets } = useDBRMarkets();
    const { data } = useCustomSWR('/api/dola/rate-comparator?v=1.1.2');
    const [isSmallerThan] = useMediaQuery(`(max-width: ${mobileThreshold}px)`);

    projectCollaterals['FiRM'] = markets?.filter(m => !m.borrowPaused).map(m => m.underlying.symbol)

    const collateralFilterFunction = (r, collateralFilter): string => {
        return !collateralFilter || (!!collateralFilter && (r.collateral.replace(/^ETH$/, 'WETH') === collateralFilter || (r.collateral === 'Multiple' && projectCollaterals[r.project].includes(collateralFilter.replace(/^ETH$/, 'WETH')))))
    }

    const allCollaterals = [...new Set(Object.keys(projectCollaterals).flatMap(p => projectCollaterals[p]))];

    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles || lightTheme;

    return <VStack w='full' spacing="10">
        <UngroupedComparator allRates={data?.rates} themeStyles={_themeStyles} isSmallerThan={isSmallerThan} showLabel={showLabel} collateralFilterFunction={collateralFilterFunction} />
        <GroupedComparator allRates={data?.rates} allCollaterals={allCollaterals} themeStyles={_themeStyles} isSmallerThan={isSmallerThan} showLabel={showLabel} collateralFilterFunction={collateralFilterFunction} />
    </VStack>
}