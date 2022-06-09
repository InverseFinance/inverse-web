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
  xinvManagerPC,
  xinvUnderlying,
  xinvEscrow,
  governance,
  govTreasury,
  govGuard,
  govToken,
  govStakedToken,
  dola,
  dolaOperator,
  opBondManager,
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
  xinvManagerPC: string,
  xinvUnderlying: string,
  xinvEscrow: string,
  governance: string,
  govTreasury: string,
  govGuard: string,
  govToken: string,
  govStakedToken: string,
  dola: string,
  dolaOperator: string,
  opBondManager: string,
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
      label: 'Frontier (Comptroller)',
      id: comptroller,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(compGuard)}`, id: compGuard, y: 400, linkLabel: 'Pause Guardian' },
        { label: namedAddress(compAdmin), id: compAdmin, linkLabel: 'Frontier Admin' },
      ]
    },
    {
      label: '⏱️ Escrow',
      id: escrow,
      y: 300,
      deltaX: 300,
      style: primaryStyle,
      targetPosition: 'bottom',
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
      label: `⚖️ ${namedAddress(xinvAdmin)}`,
      id: xinvAdmin,
      x: 1200,
      y: 0,
      style: primaryStyle,
      sourcePosition: 'left',
      targetPosition: 'bottom',
      targets: [
        { label: '👥 Policy Committee', id: xinvManagerPC, linkLabel: 'PC', x: 800, y: 0, targetPosition: 'right' }
      ]
    },
    {
      label:'⚖️ BondsManager',
      id: opBondManager,
      x: 1050,
      y: 150,
      sourcePosition: 'left',
      style: primaryStyle,
      targets: [
        { id: xinvManagerPC, linkLabel: 'PC' }
      ]
    },
    {
      label: <>{invImg} xINV</>,
      id: xinv,
      y: 400,
      deltaX: 700,
      style: blueStyle,
      targets: [
        { label: "Frontier (Comptroller)", id: xinvComptroller, linkLabel: 'xINV Comptroller' },
        { label: `⚖️ ${namedAddress(xinvAdmin)}`, id: xinvAdmin, linkLabel: 'xINV Admin', y: 0, x: 1200, style: primaryStyle },
        { label: <>{invImg} INV</>, id: xinvUnderlying, style: blueStyle, linkLabel: 'xINV Underlying', deltaX: 400, y: 800 },
        { label: 'xINV Escrow', id: xinvEscrow, linkLabel: 'xINV Escrow' },
      ]
    },
    {
      label: "🏛️ Governor Mills",
      id: governance,
      style: primaryStyle,
      y: 800,
      sourcePosition: 'top',
      targets: [
        { label: `🔐 ${namedAddress(govGuard)}`, id: govGuard, linkLabel: "Gov Guardian", y: 600, x: 200 },
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

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '600px' } }

  if (!baseWidth) {
    return <Box {...boxProps}>&nbsp;</Box>
  }

  return (
    <FlowChart
      options={{ showControls: !isLargerThan, showBackground: !isLargerThan, autofit: false, defaultZoom: 0.6 }}
      flowData={links}
      boxProps={boxProps}
    />
  )
};