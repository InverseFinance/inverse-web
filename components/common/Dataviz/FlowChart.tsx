import ReactFlow, {
  Controls,
  Background,
  MarkerType,
  ReactFlowInstance,
} from 'react-flow-renderer';

import { FlowChartData, FlowChartElementsOptions, FlowChartOptions, NetworkIds } from '@app/types';
import { Box, VStack, Flex, BoxProps } from '@chakra-ui/react';
import { shortenAddress } from '@app/util';
import ScannerLink from '@app/components/common/ScannerLink';
import { useEffect, useState } from 'react';
import { isAddress } from 'ethers/lib/utils';

const defaultNodeSyle = {
  background: '#bbb7e0cc',
  color: 'white',
  border: '1px solid #222138',
  width: 180,
  fontSize: '16px',
  borderRadius: '50px',
  padding: '20px',
};


const ElementLabel = ({ label, address, chainId }: { label: React.ReactNode, address: string, chainId: NetworkIds }) => {
  return (
    <VStack>
      <Flex fontWeight="bold" fontSize="18px" alignItems="center">{label}</Flex>
      {
        isAddress(address) && !!address && <ScannerLink color="white" chainId={chainId} _hover={{ color: 'blackAlpha.800' }} value={address} label={shortenAddress(address)} />
      }
    </VStack>
  )
}

const toElements = (links: FlowChartData[], options?: FlowChartElementsOptions, chainId: NetworkIds) => {
  const elements: any = [];

  const width = options?.width || 1000;
  const height = options?.height || 1000;
  const originX = options?.originX || width / 2;
  const originY = options?.originY || 0;
  const xGap = options?.xGap ?? 300;
  const yGap = options?.yGap ?? 200;
  // main sources
  links.forEach((link, i) => {
    const id = link.id.toLowerCase();
    if (!elements.find((el) => el.id === id)) {
      const address = id?.split('-')?.[0];
      elements.push({
        id,
        data: { label: <ElementLabel chainId={chainId} label={link.label} address={address} /> },
        position: { x: link.x ?? (originX + (link?.deltaX || 0)), y: link.y ?? (originY + yGap * i) },
        style: { ...defaultNodeSyle, ...(link.style || {}) },
        targetPosition: link.targetPosition,
        sourcePosition: link.sourcePosition,
      })
    }
  });

  links.forEach((link, i) => {

    // src targets
    link.targets?.forEach((target, j) => {
      const targetId = target.id.toLowerCase();
      if (!elements.find((el) => el.id === targetId)) {
        const x = target.x ?? ((-xGap + originX + (xGap * j)) + (target.deltaX || 0))
        const y = target.y ?? (yGap * (i + 1) + (target.deltaY || 0))
        const address = targetId?.split('-')?.[0];
        elements.push({
          data: { label: <ElementLabel chainId={chainId} label={target.label} address={address} /> },
          id: targetId,
          position: { x, y },
          style: { ...defaultNodeSyle, ...(target.style || {}) },
          targetPosition: target.targetPosition,
          sourcePosition: target.sourcePosition,
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
          markerEnd: MarkerType.ArrowClosed,
          type: target.type,
          id: bridgeId,
          source: srcId,
          target: targetId,
          animated: true,
          label: target.linkLabel,
          className: 'info-bg',
          labelStyle: { color: 'white', fontSize: '12px', textAlign: 'center', transform: 'translateX(-2px)', ...target.labelStyle },
          // labelShowBg: false,
          labelBgPadding: target.labelBgPadding || [18, 4],
          labelBgBorderRadius: 4,
          arrowHeadColor: '#F00',
          labelBgStyle: { fill: '#FFCC00', color: '#fff', ...target.labelContainerStyle },
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
  chainId = NetworkIds.mainnet,
  noInteraction = false,
}: {
  flowData: FlowChartData[],
  options?: FlowChartOptions,
  boxProps?: BoxProps
  chainId?: NetworkIds,
  noInteraction?: boolean,
}) => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance| undefined>(undefined)

  const handleLoad = (instance: ReactFlowInstance) => {
    if(!instance) { return }
    instance.fitView();
    setTimeout(() => {
      instance.fitView();
    }, 0);
    
    if (!reactFlowInstance) {
      setReactFlowInstance(instance);
    }
  }

  useEffect(() => {
    if (!reactFlowInstance || !options?.autofit) { return }
    handleLoad(reactFlowInstance);
  }, [flowData, options, boxProps]);

  if (!flowData?.length) {
    return     <Box {...boxProps}></Box>
  }

  const elements = toElements(flowData, options?.elementsOptions, chainId);
  const nodes = elements.filter(e => e.id.split('-').length === 1);
  const edges = elements.filter(e => e.id.split('-').length > 1);

  const { autofit } = options || {};

  return (
    <Box position="relative" {...boxProps}>
      {
        noInteraction && <Box zIndex="5" position="absolute" left="0" right="0" top="0" bottom="0" background="transparent">&nbsp;</Box>
      }
      {
        !!elements?.length
        && <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={autofit ? (reactFlowInstance: ReactFlowInstance) => handleLoad(reactFlowInstance) : undefined}
          {...options}
        >
          {options?.showControls && <Controls />}
          {options?.showBackground && <Background />}
        </ReactFlow>
      }
    </Box>
  )
};