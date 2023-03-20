import { getNetworkConfigConstants } from '@app/util/networks';
import { FlowChartData, NetworkIds } from '@app/types';

import { Box, HStack, Image, useMediaQuery, Text } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';
import { UnderlyingItemBlock } from '../common/Assets/UnderlyingItemBlock';

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
      label: <HStack w='full' color="white !important">        
        <UnderlyingItemBlock imgSize={20} symbol={m.name} textProps={{ color: 'white' }} />        
      </HStack>,
      id: m.address,
      style: primaryStyle,
      x: 350,
      y,
      sourcePosition: 'top',
      targetPosition: 'top',
      targets: [
        { label: `🔐 ${namedAddress(m.escrowImplementation)}`, x: 0, y, id: `${m.address}-${m.escrowImplementation}`, targetPosition: 'top', linkLabel: "Escrow Type", style: greenStyle },       
        // { label: ``, id: DBR, targetPosition: 'bottom', linkLabel: "Uses DOLA Borrowing Right Tokens as cost", style: greenStyle, labelContainerStyle: { width: '280px' } },
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
      ]
    },
    {
      label: `📜 Oracle`, x: 700, y: 150, id: F2_ORACLE, sourcePosition: 'bottom', linkLabel: "Pessimistic Oracle", style: greenStyle,
      // targets: F2_MARKETS?.map((m, i) => {
      //   return { label: '', id: m.address, linkLabel: 'Pessimistic Oracle', targetPosition: 'right' }
      // })
    },
    {
      label: `🛡️ Borrow Controller`,
      id: F2_CONTROLLER,
      style: greenStyle,
      x: 700,
      y: 0,
      sourcePosition: 'top',
      // targets: [
      //   { label: <>{dolaImg}DOLA</>, id: DOLA, x: 700, y: 0, linkLabel: 'Can limit / restrict Borrowing', labelContainerStyle: { width: '195px' }, targetPosition: 'bottom' }
      // ]
      //   .concat(
      //     F2_MARKETS?.map((m, i) => {
      //       return { label: '', id: m.address, linkLabel: 'Controller' }
      //     })
      //   )
    },
    ...marketLinks,
  ]

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '400px' } }

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
        height: 1800,
      }}
      flowData={links}
      boxProps={boxProps}
    />
  )
};