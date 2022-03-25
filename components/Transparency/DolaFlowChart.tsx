import { getNetworkConfigConstants, getNetworkImage } from '@app/util/networks';
import { FedWithData, FlowChartData, NetworkIds } from '@app/types';

import { Box, Image, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';

const { DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const dolaImg = <Image mr="2" display="inline-block" src={TOKENS[DOLA].image} ignoreFallback={true} width={'20px'} height={'20px'} />

const elementsOptions = {
  yGap: 150,
};

export const DolaFlowChart = ({
  dola,
  dolaOperator,
  feds,
}: {
  feds: FedWithData[]
  dola: string,
  dolaOperator: string,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [baseheight, setBaseHeight] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 400px)')

  useEffect(() => {
    setBaseWidth(`${screen.availWidth || screen.width}px`)
    setBaseHeight(`${(screen.availHeight || screen.height) / 2}px`)
  }, [isLargerThan]);

  const fedLinks = feds?.map(fed => {
    return {
      label: <>
        <Image borderRadius="10px" src={`${fed.projectImage}`} w={'20px'} h={'20px'} mr="1" />
        {namedAddress(fed.address)}
        <Image position="absolute" left="0" right="0" top="5px" m="auto" h="15px" w="15px" src={getNetworkImage(fed.chainId)} />
      </>,
      id: fed.address,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(fed.chair)}`, id: fed.chair, linkLabel: 'Fed Chair', deltaX: 600, y: elementsOptions.yGap },
        { label: `🏦 ${namedAddress(fed.gov)}`, id: fed.gov, linkLabel: 'Fed Gov', style: greenStyle },
        // { label: namedAddress(fed.ctoken), id: fed.ctoken, linkLabel: 'Token' },
      ]
    }
  }) || []

  const links: FlowChartData[] = [
    {
      label: <>{dolaImg}DOLA</>,
      id: dola,
      style: blueStyle,
      targets: [
        { label: `🏦 ${namedAddress(dolaOperator)}`, id: dolaOperator, linkLabel: "DOLA Operator", style: greenStyle },
      ]
    },
    ...fedLinks,
  ]

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '600px' } }

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