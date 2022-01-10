import ReactFlow, {
  OnLoadParams,
  Controls,
  ArrowHeadType,
} from 'react-flow-renderer';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types';
import useEtherSWR from '@inverse/hooks/useEtherSWR';
import { Box, Image, Text, VStack, Flex } from '@chakra-ui/react';
import { namedAddress, shortenAddress } from '@inverse/util';
import ScannerLink from '../ScannerLink';
import { parseEther } from '@ethersproject/units';

const { INV, XINV, ESCROW, COMPTROLLER, TREASURY, GOVERNANCE, DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const onLoad = (reactFlowInstance: OnLoadParams) => reactFlowInstance.fitView();

type FlowLink = {
  id: string
  label: string
  targets: {
    label: string,
    id: string,
    linkLabel?: string,
    x?: number,
    y?: number,
    deltaX?:number
    deltaY?:number
    style?: Object
  }[]
  x?: number
  y?: number
  deltaX?: number
  deltaY?: number
  style?: Object
}

const defaultNodeSyle = {
  background: '#bbb7e0cc',
  color: 'white',
  border: '1px solid #222138',
  width: 180,
  fontSize: '16px',
  borderRadius: '50px',
  padding: '20px',
  // paddingRight: '20px',
};

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const dolaImg = <Image mr="2" display="inline-block" src={TOKENS[DOLA].image} ignoreFallback={true} width={'20px'} height={'20px'} />
const invImg = <Image mr="2" display="inline-block" src={TOKENS[INV].image} ignoreFallback={true} width={'20px'} height={'20px'} />

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
        style: { ...defaultNodeSyle, ...(link.style||{}) },
      })
    }
  });

  links.forEach((link, i) => {
    // src targets
    link.targets?.forEach((target, j) => {
      if (!elements.find((el) => el.id === target.id)) {
        const x = target.x ?? ((-xDelta + originX + (xDelta * j)) + (target.deltaX||0))
        const y = target.y ?? (yDelta * (i + 1) + (target.deltaY||0))
        elements.push({
          data: { label: target.label },
          id: target.id,
          position: { x, y },
          style: { ...defaultNodeSyle, ...(target.style||{}) },
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
        arrowHeadColor: '#F00',
        labelBgStyle: { fill: '#FFCC00', color: '#fff' },
      })
    });
  });
  return elements;
}

const ElementLabel = ({ label, address }: { label: React.ReactNode, address: string }) => {
  return (
    <VStack>
      <Flex fontWeight="bold" fontSize="18px" alignItems="center">{label}</Flex>
      <ScannerLink _hover={{ color: 'blackAlpha.800' }} value={address} label={shortenAddress(address)} />
    </VStack>
  )
}

export const FlowChart = () => {
  // const [elements, setElements] = useState([])
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
    [GOVERNANCE, 'quorumVotes'],
    [DOLA, 'operator'],
  ])

  const [escrowGov, compAdmin, compGuard, treasuryAdmin, govGuard, govInv, govXinv, govTreasury, quorumVotes, dolaOperator] = daoData || ['', '', '', '', '', '', '', '', parseEther('4000')];

  if (!daoData || !xinvData) {
    return <Text mt="5">Loading...</Text>
  }

  const links = [
    {
      label: <ElementLabel label="⚓ Anchor (Comptroller)" address={comptroller} />,
      id: comptroller,
      style: primaryStyle,
      targets: [
        { label: <ElementLabel label={`🔐 ${namedAddress(compGuard)}`} address={compGuard} />, id: compGuard, y: 400, linkLabel: 'Market Pause Guardian' },
        { label: <ElementLabel label={namedAddress(compAdmin)} address={compAdmin} />, id: compAdmin, linkLabel: 'Anchor Admin' },
      ]
    },
    {
      label: <ElementLabel label="⏱️ Escrow" address={escrow} />,
      id: escrow,
      y: 250,
      deltaX: 350,
      style: primaryStyle,
      targets: [
        { label: <ElementLabel label="Governor Mills" address={escrowGov} />, id: escrowGov, linkLabel: 'Escrow Admin' },
      ]
    },
    {
      label: <ElementLabel label={`🏦 ${namedAddress(govTreasury)}`} address={govTreasury} />,
      id: govTreasury,
      style: greenStyle,
      targets: [
        { label: <ElementLabel label={namedAddress(treasuryAdmin)} address={treasuryAdmin} />, id: treasuryAdmin, linkLabel: "Treasury Admin" },
      ],
    },
    {
      label: <ElementLabel label={<>{invImg} xINV</>} address={XINV} />,
      id: XINV,
      y: 350,
      deltaX: 700,
      style: blueStyle,
      targets: [
        { label: <ElementLabel label="⚓ Anchor (Comptroller)" address={comptroller} />, id: comptroller, linkLabel: 'xINV Comptroller' },
        { label: <ElementLabel label={namedAddress(xinvAdmin)} address={xinvAdmin} />, id: xinvAdmin, linkLabel: 'xINV Admin' },
        { label: <ElementLabel label={<>{invImg} INV</>} address={xinvUnderlying} />, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400 },
        { label: <ElementLabel label="Escrow" address={escrow} />, id: escrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: <ElementLabel label="🏛️ Governor Mills" address={GOVERNANCE} />,
      id: GOVERNANCE,
      style: primaryStyle,
      targets: [
        { label: <ElementLabel label={`🔐 ${namedAddress(govGuard)}`} address={govGuard} />, id: govGuard, linkLabel: "Governor Guardian" },
        // { label: <ElementLabel label={namedAddress(govTreasury)} address={govTreasury} />, id: govTreasury, linkLabel: "Governor Treasury" },
        { label: <ElementLabel label={namedAddress(govInv)} address={govInv} />, id: govInv, linkLabel: 'GOV Token' },
        { label: <ElementLabel label={namedAddress(govXinv)} address={govXinv} />, id: govXinv, linkLabel: 'GOV staked token' },
      ]
    },
    {
      label: <ElementLabel label={<>{dolaImg}DOLA</>} address={DOLA} />,
      id: DOLA,
      deltaX: 350,
      y: 475,
      style: blueStyle,
      targets: [
        { label: <ElementLabel label={namedAddress(dolaOperator)} address={dolaOperator} />, id: dolaOperator, linkLabel: "DOLA Operator" },
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
           <Controls />
          {/* <Background /> */}
        </ReactFlow>
      }
    </Box>
  )
};