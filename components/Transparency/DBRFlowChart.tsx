import { getNetworkConfigConstants } from '@app/util/networks';
import { FlowChartData, NetworkIds } from '@app/types';

import { Box, HStack, Image, useMediaQuery, Text } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';

const { DOLA, DBR, TOKENS, F2_MARKETS, F2_ORACLE, F2_CONTROLLER } = getNetworkConfigConstants(NetworkIds.mainnet);

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const dolaImg = <Image mr="2" borderRadius="50px" display="inline-block" src={TOKENS[DOLA].image} ignoreFallback={true} width={'20px'} height={'20px'} />
const dbrImg = <Image mr="2" borderRadius="50px" display="inline-block" src={TOKENS[DBR].image} ignoreFallback={true} width={'20px'} height={'20px'} />

const elementsOptions = {
  yGap: 0,
};

export const DBRFlowChart = ({
  operator,
}: {
  operator: string,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [baseheight, setBaseHeight] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 400px)')

  useEffect(() => {
    setBaseWidth(`${screen.availWidth || screen.width}px`)
    setBaseHeight(`${(screen.availHeight || screen.height) / 2}px`)
  }, [isLargerThan]);

  const marketLinks = F2_MARKETS?.map((m, i) => {
    const y = 200 + i * 150;
    return {
      label: <HStack w='full'>
        <Image borderRadius="10px" src={`${m.icon}`} w={'20px'} h={'20px'} />
        <Text whiteSpace="nowrap" color="white">{m.name} Market</Text>
      </HStack>,
      id: m.address,
      style: primaryStyle,
      x: 350,
      y,
      sourcePosition: 'top',
      targetPosition: 'right',
      targets: [
        { label: `📜 Oracle`, x: 0, y, id: F2_ORACLE, targetPosition: 'top', linkLabel: "Pessimistic Oracle", style: greenStyle },
        { label: `🛡️ Borrow Controller`, x: 700, y, id: F2_CONTROLLER, targetPosition: 'top', linkLabel: "Controller", style: greenStyle },
        { label: ``, id: DBR, targetPosition: 'bottom', linkLabel: "Uses DOLA Borrowing Right Tokens as cost", style: greenStyle, labelContainerStyle: { width: '280px' } },
      ]
    }
  }) || [];

  const links: FlowChartData[] = [
    {
      label: <>{dbrImg}DBR</>,
      id: DBR,
      style: blueStyle,
      x: 350,
      sourcePosition: 'left',
      targetPosition: 'bottom',
      targets: [
        { label: `🏦 ${namedAddress(operator)}`, x: 0, y: 0, id: operator, targetPosition: 'right', linkLabel: "DBR Operator", style: greenStyle },
        // { label: '', x: 0, y: 0, id: operator, targetPosition: 'right', linkLabel: "DBR Operator", style: greenStyle },
        // ...F2_MARKETS?.map((m, i) => {
        //   return { label: `🏦 ${namedAddress(operator)}`, x: 0, y: 0, id: operator, targetPosition: 'right', linkLabel: "DBR Operator", style: greenStyle }
        // },
      ]
    },
    {
      label: <>{dolaImg}DOLA</>,
      id: DOLA,
      style: blueStyle,
      x: 700,
      sourcePosition: 'left',
    },
    {
      label: `🛡️ Borrow Controller`,
      id: F2_CONTROLLER,
      style: greenStyle,
      x: 700,
      y: 200,      
      targets: [
        { id: DOLA, linkLabel: 'Can restrict Borrowing', labelContainerStyle: { width: '160px' } }
      ]
    },
    ...marketLinks,    
  ]

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '300px' } }

  if (!baseWidth) {
    return <Box {...boxProps}>&nbsp;</Box>
  }

  return (
    <FlowChart
      options={{
        showControls: !isLargerThan,
        showBackground: !isLargerThan,
        autofit: true,
        elementsOptions,
      }}
      flowData={links}
      boxProps={boxProps}
    />
  )
};