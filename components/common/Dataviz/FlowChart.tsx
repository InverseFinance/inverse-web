import ReactFlow, {
  OnLoadParams,
  Controls,
  ArrowHeadType,
} from 'react-flow-renderer';

import { FlowChartData, FlowChartOptions } from '@inverse/types';
import { Box, VStack, Flex } from '@chakra-ui/react';
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

    const linkId = link.id.toLowerCase();
    // arrows (egdes)
    link.targets?.forEach(target => {
      const targetId = target.id.toLowerCase();
      elements.push({
        arrowHeadType: ArrowHeadType.ArrowClosed,
        // type: 'step',
        id: `${linkId}-${targetId}`,
        source: linkId,
        target: targetId,
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

export const FlowChart = ({
  flowData,
  options,
}: {
  flowData: FlowChartData[],
  options?: FlowChartOptions,
}) => {
  if(!flowData?.length) {
    return <>Loading...</>
  }

  const elements = toElements(flowData)

  return (
    <Box w='1000px' h='600px'>
      {
        !!elements?.length
        && <ReactFlow
          elements={elements}
          onLoad={onLoad}
        >
          { options?.showControls && <Controls /> }
        </ReactFlow>
      }
    </Box>
  )
};