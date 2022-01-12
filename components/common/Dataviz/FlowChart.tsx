import ReactFlow, {
  OnLoadParams,
  Controls,
  ArrowHeadType,
  Background,
} from 'react-flow-renderer';

import { FlowChartData, FlowChartOptions } from '@inverse/types';
import { Box, VStack, Flex, BoxProps } from '@chakra-ui/react';
import { shortenAddress } from '@inverse/util';
import ScannerLink from '@inverse/components/common/ScannerLink';

const onLoad = (reactFlowInstance: OnLoadParams) => reactFlowInstance.fitView();

const defaultNodeSyle = {
  background: '#bbb7e0cc',
  color: 'white',
  border: '1px solid #222138',
  width: 180,
  fontSize: '16px',
  borderRadius: '50px',
  padding: '20px',
};


const ElementLabel = ({ label, address }: { label: React.ReactNode, address: string }) => {
  return (
    <VStack>
      <Flex fontWeight="bold" fontSize="18px" alignItems="center">{label}</Flex>
      <ScannerLink _hover={{ color: 'blackAlpha.800' }} value={address} label={shortenAddress(address)} />
    </VStack>
  )
}

const toElements = (links: FlowChartData[]) => {
  const elements: any = [];

  const width = 1000;
  const height = 1000;
  const originX = width / 2;
  const originY = height / 2;
  const xDelta = 300;
  const yDelta = 200;
  // main sources
  links.forEach((link, i) => {
    const id = link.id.toLowerCase();
    if (!elements.find((el) => el.id === id)) {
      elements.push({
        id,
        data: { label: <ElementLabel label={link.label} address={id} /> },
        position: { x: link.x ?? (originX + (link?.deltaX || 0)), y: link.y ?? (yDelta * i) },
        style: { ...defaultNodeSyle, ...(link.style || {}) },
      })
    }
  });

  links.forEach((link, i) => {

    // src targets
    link.targets?.forEach((target, j) => {
      const targetId = target.id.toLowerCase();
      if (!elements.find((el) => el.id === targetId)) {
        const x = target.x ?? ((-xDelta + originX + (xDelta * j)) + (target.deltaX || 0))
        const y = target.y ?? (yDelta * (i + 1) + (target.deltaY || 0))
        elements.push({
          data: { label: <ElementLabel label={target.label} address={targetId} /> },
          id: targetId,
          position: { x, y },
          style: { ...defaultNodeSyle, ...(target.style || {}) },
        })
      }
    });

    const srcId = link.id.toLowerCase();
    // arrows (egdes)
    link.targets?.forEach(target => {
      const targetId = target.id.toLowerCase();
      const bridgeId = `${srcId}-${targetId}`
      if (!elements.find((el) => el.id === bridgeId)) {
        elements.push({
          arrowHeadType: ArrowHeadType.ArrowClosed,
          // type: 'step',
          id: bridgeId,
          source: srcId,
          target: targetId,
          animated: true,
          label: target.linkLabel,
          className: 'info-bg',
          labelStyle: { color: 'white', fontSize: '12px', textAlign: 'center', transform: 'translateX(-2px)' },
          // labelShowBg: false,
          labelBgPadding: [18, 4],
          labelBgBorderRadius: 4,
          arrowHeadColor: '#F00',
          labelBgStyle: { fill: '#FFCC00', color: '#fff' },
        })
      } else {
        elements[elements.findIndex((el) => el.id === bridgeId)].label += ` & ${target.linkLabel}`
      }
    });
  });
  return elements;
}

export const FlowChart = ({
  flowData,
  options,
  boxProps,
}: {
  flowData: FlowChartData[],
  options?: FlowChartOptions,
  boxProps?: BoxProps
}) => {
  if(!flowData?.length) {
    return <>Loading...</>
  }

  const elements = toElements(flowData)

  return (
    <Box {...boxProps}>
      {
        !!elements?.length
        && <ReactFlow
          elements={elements}
          onLoad={options?.autofit ? onLoad : undefined}
        >
          { options?.showControls && <Controls /> }
          { options?.showBackground && <Background /> }
        </ReactFlow>
      }
    </Box>
  )
};