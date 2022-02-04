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
  xinvManagerPC,
  xinvUnderlying,
  xinvEscrow,
  govTreasury,
}: {
  escrow: string,
  escrowGov: string,
  xinv: string,
  xinvOld: string,
  xinvAdmin: string,
  xinvManagerPC: string,
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
      y: 550,
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
      label: `⚖️ ${namedAddress(xinvAdmin)}`,
      id: xinvAdmin,
      x: 800,
      y: 0,
      style: primaryStyle,
      sourcePosition: 'left',
      targetPosition: 'bottom',
      targets: [
        { label: '👥 Policy Committee', id: xinvManagerPC, linkLabel: 'PC', x: 500, y: 0, targetPosition: 'right' }
      ]
    },
    {
      label: <>{invImg} xINV</>,
      id: xinv,
      y: 300,
      deltaX: 300,
      style: blueStyle,
      targets: [
        { label: namedAddress(xinvAdmin), id: xinvAdmin, linkLabel: 'xINV Admin' },
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400, y: 550 },
        { label: 'xINV Escrow', id: xinvEscrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: <>{invImg} xINV (old)</>,
      id: xinvOld,
      y: 200,
      deltaX: 550,
      style: blueStyle,
      targets: [
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 450 },
      ]
    },
  ]

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '600px' } }

  if (!baseWidth) {
    return <Box {...boxProps}>&nbsp;</Box>
  }

  return (
    <FlowChart
      options={{ showControls: !isLargerThan, showBackground: !isLargerThan, autofit: false, defaultZoom: 0.7 }}
      flowData={links}
      boxProps={boxProps}
    />
  )
};