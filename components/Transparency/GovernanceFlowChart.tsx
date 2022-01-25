import { getNetworkConfigConstants } from '@app/util/networks';
import { FlowChartData, NetworkIds } from '@app/types';

import { Box, Image, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';

const { INV, DOLA, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const dolaImg = <Image mr="2" display="inline-block" src={TOKENS[DOLA].image} ignoreFallback={true} width={'20px'} height={'20px'} />
const invImg = <Image mr="2" display="inline-block" src={TOKENS[INV].image} ignoreFallback={true} width={'20px'} height={'20px'} />

export const GovernanceFlowChart = ({
  comptroller,
  compGuard,
  compAdmin,
  escrow,
  escrowGov,
  treasuryAdmin,
  xinv,
  xinvComptroller,
  xinvAdmin,
  xinvUnderlying,
  xinvEscrow,
  governance,
  govTreasury,
  govGuard,
  govToken,
  govStakedToken,
  dola,
  dolaOperator,
}: {
  comptroller: string,
  compGuard: string,
  compAdmin: string,
  escrow: string,
  escrowGov: string,
  treasuryAdmin: string,
  xinv: string,
  xinvComptroller: string,
  xinvAdmin: string,
  xinvUnderlying: string,
  xinvEscrow: string,
  governance: string,
  govTreasury: string,
  govGuard: string,
  govToken: string,
  govStakedToken: string,
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

  const links: FlowChartData[] = [
    {
      label: '⚓ Anchor (Comptroller)',
      id: comptroller,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(compGuard)}`, id: compGuard, y: 400, linkLabel: 'Pause Guardian' },
        { label: namedAddress(compAdmin), id: compAdmin, linkLabel: 'Anchor Admin' },
      ]
    },
    {
      label: '⏱️ Escrow',
      id: escrow,
      y: 270,
      deltaX: 300,
      style: primaryStyle,
      targets: [
        { label: 'Escrow Admin', id: escrowGov, linkLabel: 'Escrow Admin' },
      ]
    },
    {
      label: `🏦 ${namedAddress(govTreasury)}`,
      id: govTreasury,
      style: greenStyle,
      targets: [
        { label: namedAddress(treasuryAdmin), id: treasuryAdmin, linkLabel: "Treasury Admin" },
      ],
    },
    {
      label: <>{invImg} xINV</>,
      id: xinv,
      y: 350,
      deltaX: 700,
      style: blueStyle,
      targets: [
        { label: "⚓ Anchor (Comptroller)", id: xinvComptroller, linkLabel: 'xINV Comptroller' },
        { label: namedAddress(xinvAdmin), id: xinvAdmin, linkLabel: 'xINV Admin' },
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400 },
        { label: 'xINV Escrow', id: xinvEscrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: "🏛️ Governor Mills",
      id: governance,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(govGuard)}`, id: govGuard, linkLabel: "Gov Guardian" },
        { label: namedAddress(govToken), id: govToken, linkLabel: 'GOV Token' },
        { label: namedAddress(govStakedToken), id: govStakedToken, linkLabel: 'Staked Token' },
      ]
    },
    {
      label: <>{dolaImg}DOLA</>,
      id: dola,
      deltaX: 300,
      y: 475,
      style: blueStyle,
      targets: [
        { label: namedAddress(dolaOperator), id: dolaOperator, linkLabel: "DOLA Operator" },
      ]
    },
  ]

  const boxProps = { w: { base: baseWidth, lg: '1000px' }, h: { base: baseheight, lg: '600px' } }

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