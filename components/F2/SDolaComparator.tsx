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
import { SettingsIcon } from "@chakra-ui/icons";
import InfoModal from "../common/Modal/InfoModal";
import { Input } from "../common/Input";
import { lightTheme } from '@app/variables/theme'
import { useState } from "react";

const projectImages = {
    'Frax': 'https://icons.llamao.fi/icons/protocols/frax?w=48&h=48',
    'Ethena': 'https://icons.llamao.fi/icons/protocols/ethena?w=48&h=48',
    'Aave-V3': 'https://icons.llamao.fi/icons/protocols/aave-v3?w=48&h=48',
    'FiRM': 'https://icons.llamao.fi/icons/protocols/inverse-finance?w=48&h=48',
    'Spark': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
    'Curve': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
    'Anzen': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
    'Sky': 'https://icons.llamao.fi/icons/protocols/spark?w=48&h=48',
}

const CollateralToken = ({ collateral, isMobile = false, themeStyles, image }: { project: string, isMobile: boolean, themeStyles: any, image: string }) => {
    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles;
    return <HStack spacing='4'>
        {
            !!image && <Image borderRadius="50px" src={image} h={isMobile ? '20px' : '40px'} />
        }
        <Text color={_themeStyles.colors.mainTextColor} fontWeight="extrabold" fontSize={isMobile ? '20px' : '24px'}>
            {collateral}
        </Text>
    </HStack>
}

const RateListItem = ({ fields, apy, symbol, image, themeStyles, isMobile }) => {
    const comps = {
        'symbol': <CollateralToken isMobile={isMobile} collateral={symbol} image={image} themeStyles={themeStyles} />,
        'apy': <Text fontWeight="extrabold" fontSize={{ base: '20px', lg: '24px' }} color={themeStyles.colors.mainTextColor}>
            {apy ? shortenNumber(apy, 2) + '%' : '-'}
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
    // {
    //     field: 'project',
    //     label: 'Project',
    //     header: ({ ...props }) => <ColHeader minWidth="110px" justify="flex-start"  {...props} />,
    //     value: ({ project }) => {
    //         return <Cell minWidth="110px">
    //             <Cell minWidth='110px' spacing="1" justify="center" alignItems={{ base: 'center', md: 'flex-start' }} direction={{ base: 'row', md: 'column' }}>
    //                 <Project project={project} />
    //             </Cell>
    //         </Cell>
    //     },
    // },
    {
        field: 'symbol',
        label: 'Stablecoin',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ project, symbol }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CollateralToken isMobile={true} project={project} collateral={symbol} />
            </Cell>
        },
    },
    {
        field: 'apy',
        label: 'APY',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ apy }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CellText>~{shortenNumber(apy, 0)}%</CellText>
            </Cell>
        },
    },
    {
        field: 'apy30d',
        label: 'APY 30d avg',
        header: ({ ...props }) => <ColHeader minWidth="70px" justify="center"  {...props} />,
        value: ({ apy30d }) => {
            return <Cell minWidth="70px" alignItems="center" justify="center" >
                <CellText>{apy30d ? `~${shortenNumber(apy30d, 0)}` : '-'}%</CellText>
            </Cell>
        },
    },
]

const mobileThreshold = 1000;

const FIELDS = columns.reduce((prev, curr) => ({ ...prev, [curr.field]: curr.label }), {});

const defaultFields = columns.map(c => c.field);
const defaultProjects = Object.keys(projectImages);

const UngroupedComparator = ({ title, allRates, themeStyles, isSmallerThan = false, showLabel = true }) => {
    const [fieldsText, setFieldsText] = useState(defaultFields.join(','));
    const [fields, setFields] = useState(defaultFields);    
    const [includeProjectsText, setIncludeProjectsText] = useState(defaultProjects.join(','));
    const [includeProjects, setIncludeProjects] = useState(defaultProjects);
    const { onOpen, onClose, isOpen } = useDisclosure();

    const rates = (allRates?.filter(r => !!r.apy) || [])
        .filter(r => includeProjects.includes(r.project));

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

    return <Container
        noPadding
        p='0'
        contentProps={{ p: { base: '4', sm: '8' }, direction: 'column' }}
        label={showLabel ? <Text fontSize={{ base: '22px', lg: '28px' }} fontWeight="extrabold">{title}</Text> : null}
        labelProps={showLabel ? { color: themeStyles.colors.mainTextColor } : null}
        description={showLabel ? "Compare yield on the biggest yield-bearing stablecoins" : null}
        contentBgColor={themeStyles.colors.gradient3}
        descriptionProps={{ color: themeStyles.colors.mainTextColorLight }}
        right={
            <SettingsIcon _hover={{ filter: 'brightness(1.2)' }} cursor="pointer" onClick={() => openSettings()} color={showLabel ? themeStyles.colors.mainTextColor : themeStyles.colors.contrastMainTextColor} fontSize={40} />
        }
    >
        <InfoModal title="Filter & Customize" onOk={onClose} isOpen={isOpen} onClose={onClose} minW={{ base: '98%', xl: '800px' }}>
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
                        <Text fontSize="20px" fontWeight="extrabold">Include projects:</Text>
                        <Text onClick={() => handleIncludeProjects(defaultProjects.join(','))} cursor="pointer" textDecoration="underline" fontSize="18px" fontWeight="bold">Reset</Text>
                    </HStack>
                    <Input textAlign="left" value={includeProjectsText} onChange={(e) => handleIncludeProjects(e.target.value)} />
                </VStack>
            </VStack>
        </InfoModal>
        {
            <>
                <SimpleGrid gap="3" width={`${fields.length * 210}px`} columns={fields.length}>
                    {
                        fields.map(f => {
                            return <Text color={themeStyles.colors.mainTextColor} key={f} fontWeight="extrabold" fontSize={{ base: '20px', lg: '28px' }}>
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
                            return <Link borderBottom="1px solid transparent" borderTop={`1px solid ${themeStyles.colors.mainTextColorAlpha}`} py="2" transition="200 ms all" _hover={{ borderY: `1px solid ${themeStyles.colors.mainTextColor}` }} w='full' isExternal target="_blank" href={rate.link} key={rate.symbol}>
                                <SimpleGrid gap="3" width={`${fields.length * 210}px`} columns={fields.length}>
                                    <RateListItem isMobile={isSmallerThan} fields={fields} {...rate} themeStyles={themeStyles} />
                                </SimpleGrid>
                            </Link>
                        })
                    }
                </VStack>
            </>
        }
    </Container>
}

export const SDolaComparator = ({
    themeStyles,
    title = 'Yield-Bearing Stablecoins',
    showLabel = true,
    thirtyDayAvg = 0,
}) => { 
    const { data } = useCustomSWR('/api/dola/sdola-comparator?v=1.0.3');
    const [isSmallerThan] = useMediaQuery(`(max-width: ${mobileThreshold}px)`);

    const { themeStyles: prefThemeStyles } = useAppTheme();
    const _themeStyles = themeStyles || prefThemeStyles || lightTheme;

    return <VStack w='full' spacing="10" overflow="hidden">
        <UngroupedComparator title={title} allRates={data?.rates?.map(r => ({...r, apy30d: (r.symbol === 'sDOLA' ? thirtyDayAvg  : r.apy30d)}))} themeStyles={_themeStyles} isSmallerThan={isSmallerThan} showLabel={showLabel} />        
    </VStack>
}