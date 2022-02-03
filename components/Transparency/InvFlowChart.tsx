import { getNetworkConfigConstants } from '@app/util/networks';
import { FlowChartData, NetworkIds } from '@app/types';

import { Box, Image, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';

const { INV, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const invImg = <Image mr="2" display="inline-block" src={TOKENS[INV].image} ignoreFallback={true} width={'20px'} height={'20px'} />

export const InvFlowChart = ({
  escrow,
  escrowGov,
  xinv,
  xinvOld,
  xinvAdmin,
  xinvUnderlying,
  xinvEscrow,
  govTreasury,
}: {
  escrow: string,
  escrowGov: string,
  xinv: string,
  xinvOld: string,
  xinvAdmin: string,
  xinvUnderlying: string,
  xinvEscrow: string,
  govTreasury: string,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [baseheight, setBaseHeight] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 400px)')

  useEffect(() => {
    setBaseWidth(`${screen.availWidth || screen.width}px`)
    setBaseHeight(`${(screen.availHeight || screen.height) / 2}px`)
  }, [isLargerThan]);

  const links: FlowChartData[] = [
    {
      label: '⏱️ Escrow',
      id: escrow,
      y: 600,
      deltaX: 0,
      style: primaryStyle,
      targets: [
        { label: 'Escrow Admin', id: escrowGov, linkLabel: 'Escrow Admin' },
      ]
    },
    {
      label: `🏦 ${namedAddress(govTreasury)}`,
      id: govTreasury,
      style: greenStyle,
    },
    {
      label: <>{invImg} xINV</>,
      id: xinv,
      y: 350,
      deltaX: 300,
      style: blueStyle,
      targets: [
        { label: namedAddress(xinvAdmin), id: xinvAdmin, linkLabel: 'xINV Admin' },
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400 },
        { label: 'xINV Escrow', id: xinvEscrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: <>{invImg} xINV (old)</>,
      id: xinvOld,
      y: 250,
      deltaX: 500,
      style: blueStyle,
      targets: [
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400 },
      ]
    },
  ]

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '600px' } }

  if (!baseWidth) {
    return <Box {...boxProps}>&nbsp;</Box>
  }

  return (
    <FlowChart
      options={{ showControls: !isLargerThan, showBackground: !isLargerThan, autofit: true }}
      flowData={links}
      boxProps={boxProps}
    />
  )
};