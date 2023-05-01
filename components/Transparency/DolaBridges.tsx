import { Flex, Stack, Text, Image } from "@chakra-ui/react"
import Table from "../common/Table"
import { preciseCommify } from "@app/util/misc"
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks"
import { getLpLink } from "@app/variables/tokens"
import { UnderlyingItem } from "../common/Assets/UnderlyingItem"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import Link from "../common/Link"
import { shortenNumber } from "@app/util/markets"
import Container from "../common/Container"

const ColHeader = ({ ...props }) => {
    return <Flex justify="center" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
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
    'BSC': defaultBridge,
    'Ethereum': defaultBridge,
};


const columns = [
    {
        field: 'networkName',
        label: 'Chain',
        header: ({ ...props }) => <ColHeader minWidth="80px" justify="flex-start"  {...props} />,
        value: ({ chainId, networkName }) => {
            const net = NETWORKS_BY_CHAIN_ID[chainId];
            return <Cell onClick={noPropagation} minWidth='80px' spacing="2" justify="flex-start" alignItems="center" direction="row">
                <Image src={net.image} ignoreFallback={true} title={net.name} alt={net.name} w={5} h={5} mr="2" />
                <CellText>{networkName}</CellText>
            </Cell>
        },
    },
    {
        field: 'mainBridge',
        label: 'Main Bridge',
        header: ({ ...props }) => <ColHeader minWidth="190px" justify="center"  {...props} />,
        value: ({ networkName }) => {
            const bridge = nativeBridges[networkName] || defaultBridge;
            return <Cell minWidth="190px" justify="center" fontSize="15px">
                <Link fontSize="12px" textDecoration="underline" isExternal _target="_blank" href={bridge.url}>
                    {bridge.name} <ExternalLinkIcon />
                </Link>
            </Cell>
        },
    },
    {
        field: 'apy',
        label: 'Highest LP APY',
        header: ({ ...props }) => <ColHeader minWidth="170px" justify="center"  {...props} />,
        value: ({ apy, top1Apy }) => {
            const link = getLpLink(top1Apy);
            return <Cell minWidth="170px" justify="center" fontSize="15px">
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
        header: ({ ...props }) => <ColHeader minWidth="190px" justify="center"  {...props} />,
        value: ({ tvl, top1Tvl }) => {
            const link = getLpLink(top1Tvl);
            return <Cell alignItems="center" minWidth="190px" justify="center" fontSize="15px">
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
    return <Container
        noPadding
        p="0"
        label="Biggest LPs by chain and their bridges"
        description="Learn more on Bridging DOLA across chains"
        href={'https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola'}
    >
        <Table
            key="chainId"
            columns={columns}
            items={items}
            defaultSort="tvlChain"
            defaultSortDir="desc"
        />
    </Container>
}