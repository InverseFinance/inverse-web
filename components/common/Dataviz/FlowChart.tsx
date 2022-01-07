import ReactFlow, {
  OnLoadParams,
  ArrowHeadType,
} from 'react-flow-renderer';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types';
import useEtherSWR from '@inverse/hooks/useEtherSWR';
import { Box, Text, VStack } from '@chakra-ui/react';
import { namedAddress, shortenAddress } from '@inverse/util';
import ScannerLink from '../ScannerLink';

const onLoad = (reactFlowInstance: OnLoadParams) => reactFlowInstance.fitView();

type FlowLink = {
  id: string
  label: string
  targets: { label: string, id: string, linkLabel?: string }[]
  x?: number
  y?: number
  deltaX?: number
  deltaY?: number
}

const nodeStyle = {
  background: '#ffffffdd',
  color: '#333',
  border: '1px solid #222138',
  width: 180,
  fontSize: '16px',
};

const toElements = (links: FlowLink[]) => {
  const elements: any = [];

  const width = 1000;
  const height = 1000;
  const originX = width / 2;
  const originY = height / 2;
  const xDelta = 300;
  const yDelta = 200;
  // main sources
  links.forEach((link, i) => {
    if (!elements.find((el) => el.id === link.id)) {
      elements.push({
        id: link.id,
        data: { label: link.label },
        position: { x: link.x ?? (originX + (link?.deltaX || 0)), y: link.y ?? (yDelta * i) },
        style: nodeStyle,
      })
    }
  });

  links.forEach((link, i) => {
    // src targets
    link.targets?.forEach((target, j) => {
      if (!elements.find((el) => el.id === target.id)) {
        const x = -xDelta + originX + (xDelta * j)
        elements.push({
          data: { label: target.label },
          id: target.id,
          position: { x, y: yDelta * (i + 1) },
          style: nodeStyle,
        })
      }
    });

    // arrows (egdes)
    link.targets?.forEach(target => {
      elements.push({
        arrowHeadType: ArrowHeadType.ArrowClosed,
        // type: 'step',
        data: { label: target.label },
        id: `${link.id}-${target.id}`,
        source: link.id,
        target: target.id,
        animated: true,
        label: target.linkLabel,
        labelStyle: { fontSize: '14px', width: 'fit-content' },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#FFCC00', color: '#fff' },
      })
    });
  });
  return elements;
}

const ElementLabel = ({ label, address }: { label: string, address: string }) => {
  return (
    <VStack>
      <Text color="black">{label}</Text>
      <ScannerLink color="black" _hover={{ color: 'black.500' }} value={address} label={shortenAddress(address)} />
    </VStack>
  )
}

export const FlowChart = () => {
  // const [elements, setElements] = useState([])
  const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE } = getNetworkConfigConstants(NetworkIds.mainnet);

  const { data: xinvData } = useEtherSWR([
    [XINV, 'admin'],
    [XINV, 'escrow'],
    [XINV, 'comptroller'],
    [XINV, 'underlying'],
  ])

  const [xinvAdmin, escrow, comptroller, xinvUnderlying] = xinvData || [TREASURY, ESCROW, COMPTROLLER, INV]

  const { data: daoData } = useEtherSWR([
    [escrow.toLowerCase(), 'governance'],
    [comptroller, 'admin'],
    [comptroller, 'pauseGuardian'],
    [TREASURY, 'admin'],
    [GOVERNANCE, 'guardian'],
    [GOVERNANCE, 'inv'],
    [GOVERNANCE, 'xinv'],
    [GOVERNANCE, 'timelock'],
  ])

  const [escrowGov, compAdmin, compGuard, treasuryAdmin, govGuard, govInv, govXinv, govTreasury] = daoData || ['', '', '', '', '', '', '', ''];

  if (!daoData || !xinvData) {
    return <Text mt="5">Loading...</Text>
  }

  const links = [
    {
      label: <ElementLabel label="Anchor (Comptroller)" address={comptroller} />,
      id: comptroller,
      targets: [
        { label: <ElementLabel label={namedAddress(compGuard)} address={compGuard} />, id: compGuard, linkLabel: 'Market Pause Guardian' },
        { label: <ElementLabel label={namedAddress(compAdmin)} address={compAdmin} />, id: compAdmin, linkLabel: 'Anchor Admin' },
      ]
    },
    {
      label: <ElementLabel label="Escrow" address={escrow} />,
      id: escrow,
      y: 0,
      deltaX: 400,
      targets: [
        { label: <ElementLabel label="Governor Mills" address={escrowGov} />, id: escrowGov, linkLabel: 'Escrow Admin' },
      ]
    },
    {
      label: <ElementLabel label={namedAddress(govTreasury)} address={govTreasury} />,
      id: govTreasury,
      targets: [
        { label: <ElementLabel label={namedAddress(treasuryAdmin)} address={treasuryAdmin} />, id: treasuryAdmin, linkLabel: "Treasury Admin" },
      ],
    },
    {
      label: <ElementLabel label="xINV" address={XINV} />,
      id: XINV,
      // y: 0,
      deltaX: 400,
      targets: [
        { label: <ElementLabel label="Anchor (Comptroller)" address={comptroller} />, id: comptroller, linkLabel: 'xINV Comptroller' },
        { label: <ElementLabel label={namedAddress(xinvAdmin)} address={xinvAdmin} />, id: xinvAdmin, linkLabel: 'xINV Admin' },
        { label: <ElementLabel label="INV" address={xinvUnderlying} />, id: xinvUnderlying, linkLabel: 'xINV Underlying' },
        { label: <ElementLabel label="Escrow" address={escrow} />, id: escrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: <ElementLabel label="Governor Mills" address={GOVERNANCE} />,
      id: GOVERNANCE,
      targets: [
        { label: <ElementLabel label={namedAddress(govGuard)} address={govGuard} />, id: govGuard, linkLabel: "Governor Guardian" },
        // { label: <ElementLabel label={namedAddress(govTreasury)} address={govTreasury} />, id: govTreasury, linkLabel: "Governor Treasury" },
        { label: <ElementLabel label={namedAddress(govInv)} address={govInv} />, id: govInv, linkLabel: 'GOV Token' },
        { label: <ElementLabel label={namedAddress(govXinv)} address={govXinv} />, id: govXinv, linkLabel: 'GOV staked token' },
      ]
    },
  ]

  const elements = toElements(links);

  return (
    <Box w='1000px' h='600px'>
      {
        !!elements?.length
        && <ReactFlow
          elements={elements}
          onLoad={onLoad}
        >
          {/* <Background /> */}
        </ReactFlow>
      }
    </Box>
  )
};