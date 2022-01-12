import { getNetworkConfigConstants } from '@inverse/config/networks';
import { FlowChartData, NetworkIds } from '@inverse/types';

import { Image, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@inverse/util';
import { FlowChart } from './FlowChart';
import { useEffect, useState } from 'react';

const { DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }

const dolaImg = <Image mr="2" display="inline-block" src={TOKENS[DOLA].image} ignoreFallback={true} width={'20px'} height={'20px'} />

export const DolaFlowChart = ({
  dola,
  dolaOperator,
  feds,
}: {
  feds: { address: string, chair: string, gov: string, ctoken: string }[]
  dola: string,
  dolaOperator: string,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 600px)')

  useEffect(() => {
    setBaseWidth(`${window.innerWidth || screen.availWidth}px`)
  }, []);

  const fedLinks = feds?.map(fed => {
    return {
      label: `🦅 ${namedAddress(fed.address)}`,
      id: fed.address,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(fed.chair)}`, id: fed.chair, linkLabel: 'Fed Chair', deltaX: 600, y: 200 },
        { label: `🏦 ${namedAddress(fed.gov)}`, id: fed.gov, linkLabel: 'Fed Gov' },
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
        { label: `🏦 ${namedAddress(dolaOperator)}`, id: dolaOperator, linkLabel: "DOLA Operator" },
      ]
    },
    ...fedLinks,
  ]

  if (!baseWidth) {
    return <></>
  }

  return (
    <FlowChart
      options={{ showControls: !isLargerThan, showBackground: !isLargerThan, autofit: false }}
      flowData={links}
      boxProps={{ w: { base: baseWidth, lg: '1000px' }, h: '600px' }}
    />
  )
};