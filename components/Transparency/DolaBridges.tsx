import { Flex, Stack, Text, Image, VStack } from "@chakra-ui/react"
import Table from "../common/Table"
import { preciseCommify } from "@app/util/misc"
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks"
import { getLpLink } from "@app/variables/tokens"
import { UnderlyingItem } from "../common/Assets/UnderlyingItem"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import Link from "../common/Link"
import { shortenNumber } from "@app/util/markets"
import Container from "../common/Container"
import { useMultichainPoolsForDola } from "@app/util/pools"
import { useMemo } from "react"
import { WarningMessage } from "../common/Messages"

const ColHeader = ({ ...props }) => {
    return <Flex textTransform="initial" justify="center" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack alignItems="center" cursor="default" direction="column" fontSize="12px" fontWeight="normal" justify="center" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text align="center" fontSize="12px" {...props} />
}

const noPropagation = (e: React.MouseEvent<HTMLElement>) => e.stopPropagation();

const defaultBridge = { url: 'https://app.multichain.org/#/router', name: 'Multichain' };
const nativeBridges = {
    'Optimism': { url: 'https://app.optimism.io/bridge/deposit', name: 'Native bridge' },
    'Arbitrum': { url: 'https://bridge.arbitrum.io/', name: 'Native bridge' },
    'Polygon': { url: 'https://wallet.polygon.technology/polygon/bridge/deposit', name: 'Native bridge' },
    'Avalanche': { url: 'https://core.app/bridge/', name: 'Native bridge' },
};


const columns = [
    {
        field: 'networkName',
        label: 'Chain',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="flex-start"  {...props} />,
        value: ({ chainId, networkName }) => {
            const net = NETWORKS_BY_CHAIN_ID[chainId];
            return <Cell onClick={noPropagation} minWidth='120px' spacing="2" justify="flex-start" alignItems="center" direction="row">
                <Image src={net.image} ignoreFallback={true} title={net.name} alt={net.name} w={5} h={5} mr="2" />
                <CellText>{networkName}</CellText>
            </Cell>
        },
    },
    {
        field: 'mainBridge',
        label: 'Native Bridge',
        header: ({ ...props }) => <ColHeader minWidth="120px" justify="center"  {...props} />,
        value: ({ networkName }) => {
            const bridge = nativeBridges[networkName];
            return <Cell minWidth="120px" justify="center" fontSize="15px">
                {
                    !!bridge ? <VStack>
                        <Link fontSize="12px" textDecoration="underline" isExternal _target="_blank" href={bridge.url}>
                            {bridge.name} <ExternalLinkIcon />
                        </Link>
                        {/* <CellText>
                            In: fast, to Ethereum: ~7days
                        </CellText> */}
                    </VStack> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'multichainLiquidity',
        label: 'Multichain Bridge',
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ multichainLiquidity }) => {
            return <Cell minWidth="160px" justify="center" fontSize="15px">
                {
                    multichainLiquidity !== undefined && <Link fontSize="12px" textDecoration="underline" isExternal _target="_blank" href={defaultBridge.url}>
                        {defaultBridge.name} <ExternalLinkIcon />
                    </Link>
                }
                <CellText>
                    {
                        multichainLiquidity === undefined ? 'Not available yet' :
                            ((multichainLiquidity === null ? 'Unlimited' : preciseCommify(multichainLiquidity, 0)) + ' DOLA liquidity')
                    }
                </CellText>
            </Cell>
        },
    },
    {
        field: 'apy',
        label: 'Highest LP APY',
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ apy, top1Apy }) => {
            const link = getLpLink(top1Apy);
            return <Cell minWidth="160px" justify="center" fontSize="15px">
                <Link textDecoration="underline" href={link} isExternal target="_blank" display="flex" justify="flex-start" alignItems="center" direction="row">
                    <UnderlyingItem textProps={{ fontSize: '12px', ml: '2', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90px' }} imgSize={15} {...top1Apy} label={top1Apy.lpName} showAsLp={true} chainId={top1Apy.chainId} />
                    <ExternalLinkIcon color="info" ml="1" />
                </Link>
                <CellText>{typeof apy === 'undefined' ? '-' : `${shortenNumber(apy || 0, 2)}%`}</CellText>
            </Cell>
        },
    },
    {
        field: 'tvl',
        label: 'Highest LP TVL',
        header: ({ ...props }) => <ColHeader minWidth="160px" justify="center"  {...props} />,
        value: ({ tvl, top1Tvl }) => {
            const link = getLpLink(top1Tvl);
            return <Cell alignItems="center" minWidth="160px" justify="center" fontSize="15px">
                <Link textDecoration="underline" href={link} isExternal target="_blank" display="flex" justify="flex-start" alignItems="center" direction="row">
                    <UnderlyingItem textProps={{ fontSize: '12px', ml: '2', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90px' }} imgSize={15} {...top1Tvl} label={top1Tvl.lpName} showAsLp={true} chainId={top1Tvl.chainId} />
                    <ExternalLinkIcon color="info" ml="1" />
                </Link>
                <CellText align="center">{preciseCommify(tvl, 0, true)}</CellText>
            </Cell>
        },
    },
];

export const DolaBridges = ({
    items
}) => {
    const { data } = useMultichainPoolsForDola();
    const itemsWithMultichainLiquidity = useMemo(() => {
        if (!data?.["1"]) return items;
        return items.map(item => {
            return { ...item, multichainLiquidity: data[item.chainId] }
        });
    }, [data, items]);

    return <Container
        noPadding
        p="0"
        label="Biggest LPs by chain and their bridges"
        description="Learn more on Bridging DOLA across chains"
        href={'https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola'}
    >
        <VStack spacing="4" w="100%">
            <WarningMessage
                alertProps={{ w: 'full' }}
                title="Multichain incident"
                description={
                    <VStack spacing="0" align="flex-start">
                        <Text>It is recommended to not use Multichain bridge at the moment.</Text>
                        <Text>Follow their official account for updates:</Text>
                        <Link isExternal href="https://twitter.com/MultichainOrg" textDecoration="underline" _target="_blank">
                            https://twitter.com/MultichainOrg
                        </Link>
                    </VStack>
                }
            />
            <Table
                key="chainId"
                columns={columns}
                items={itemsWithMultichainLiquidity}
                defaultSort="tvlChain"
                defaultSortDir="desc"
            />
        </VStack>
    </Container>
}