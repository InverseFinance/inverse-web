import { getNetworkConfigConstants } from '@inverse/config/networks';
import { FlowChartData, NetworkIds } from '@inverse/types';

import { Image } from '@chakra-ui/react';
import { namedAddress } from '@inverse/util';
import { FlowChart } from './FlowChart';

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

  const links: FlowChartData[] = [
    {
      label: '⚓ Anchor (Comptroller)',
      id: comptroller,
      style: primaryStyle,
      targets: [
        { label: `🔐 ${namedAddress(compGuard)}`, id: compGuard, y: 400, linkLabel: 'Market Pause Guardian' },
        { label: namedAddress(compAdmin), id: compAdmin, linkLabel: 'Anchor Admin' },
      ]
    },
    {
      label: '⏱️ Escrow',
      id: escrow,
      y: 250,
      deltaX: 350,
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
        { label: `🔐 ${namedAddress(govGuard)}`, id: govGuard, linkLabel: "Governor Guardian" },
        { label: namedAddress(govToken), id: govToken, linkLabel: 'GOV Token' },
        { label: namedAddress(govStakedToken), id: govStakedToken, linkLabel: 'GOV staked token' },
      ]
    },
    {
      label: <>{dolaImg}DOLA</>,
      id: dola,
      deltaX: 350,
      y: 475,
      style: blueStyle,
      targets: [
        { label: namedAddress(dolaOperator), id: dolaOperator, linkLabel: "DOLA Operator" },
      ]
    },
  ]

  return (
    <FlowChart flowData={links} />
  )
};