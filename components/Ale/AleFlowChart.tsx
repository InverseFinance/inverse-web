import { FlowChartData, Market, Token } from '@app/types';

import { Box, Text, useMediaQuery, VStack } from '@chakra-ui/react';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';
import { UnderlyingItem } from '../common/Assets/UnderlyingItem';
import { shortenNumber } from '@app/util/markets';
import { ConnectionLineType } from 'react-flow-renderer';

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white', width: '300px' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white', width: '300px' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white', width: '300px' }
const orangeStyle = { backgroundColor: 'orange', color: 'white', width: '300px' }

const elementsOptions = {
  yGap: 150,
};

const ItemLabel = ({ underlying, amount, worth, apy }) => {
  return <VStack>
    <UnderlyingItem
      imgContainerProps={{ mr: '2' }}
      imgSize={'40px'}
      protocolImageSize='20px'
      label={`${shortenNumber(amount, 2)} ${underlying.symbol}${!!worth ? ` (${shortenNumber(worth, 2, true)})` : ``}`}
      image={underlying.image}
      protocolImage={underlying.protocolImage}
      textProps={{ fontSize: '26px' }}
    />
    {!!apy && <Text>{shortenNumber(apy, 2, false)}% APY</Text>}
  </VStack>
}

const customEdgeOptions = {
  labelBgPadding: [10, 8],
  labelStyle: { fontSize: '18px' }
}

export const AleFlowChart = ({
  borrowMarket,
  inputToken,
  collateralMarket,
  inputAmount,
  collateralAmount,
  borrowedAmount,
  leverageLevel,
  boostedApy,
  borrowApy,
  supplyApy,
  collateralPrice,
  liquidationPrice,
  ltv,
  zapAmount,
  inputWorth,
  collateralWorth,
  borrowWorth,
}: {
  borrowMarket: Market,
  inputToken: Token,
  collateralMarket: Market,
  inputAmount: number,
  collateralAmount: number,
  borrowedAmount: number,
  leverageLevel: number,
  boostedApy: number,
  borrowApy: number,
  supplyApy: number,
  collateralPrice: number,
  liquidationPrice: number,
  ltv: number,
  zapAmount: number,
  inputWorth: number,
  collateralWorth: number,
  borrowWorth: number,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [baseheight, setBaseHeight] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 400px)')

  useEffect(() => {
    setBaseWidth(`${screen.availWidth || screen.width}px`)
    setBaseHeight(`${(screen.availHeight || screen.height) / 2}px`)
  }, [isLargerThan]);

  const collateral = collateralMarket.underlying;
  const borrowedToken = borrowMarket.underlying;

  const engineTargets = [{
    id: 'borrowed',
    linkLabel: `Borrow ${shortenNumber(borrowedAmount, 2)}`,
    type: ConnectionLineType.Straight,
    ...customEdgeOptions,
  }, {
    id: 'collateral',
    linkLabel: `Zap into ${shortenNumber(zapAmount, 2)}`,
    type: ConnectionLineType.Straight,
    ...customEdgeOptions,
  }
  ];

  const links: FlowChartData[] = [
    {
      label: <ItemLabel underlying={inputToken} amount={inputAmount} worth={inputWorth} />,
      id: 'inputToken',
      style: blueStyle,
      x: 0,
      y: 0,
      sourcePosition: 'bottom',
      targets: [{
        id: 'engine',
        linkLabel: `Deposit ${shortenNumber(inputAmount, 2)}`,
        style: primaryStyle,
        ...customEdgeOptions,
      }],
    },
    {
      label: <ItemLabel underlying={collateral} amount={collateralAmount} worth={collateralWorth} apy={supplyApy} />,
      id: 'collateral',
      style: greenStyle,
      x: 500,
      y: 0,
      targetPosition: 'bottom',
    },
    {
      label: <Text fontSize="28px">Accelerated Leverage Engine</Text>,
      id: 'engine',
      style: primaryStyle,
      targets: engineTargets,
      x: 0,
      y: 325,
      sourcePosition: 'right',
      targetPosition: 'top',
      connectionLineType: 'step',
    },
    {
      label: <ItemLabel underlying={borrowedToken} amount={borrowedAmount} worth={borrowWorth} apy={-borrowApy} />,
      id: 'borrowed',
      style: orangeStyle,
      x: 500,
      y: 400,
      sourcePosition: 'top',
      targetPosition: 'left',
      targets: [{
        id: 'collateral',
        linkLabel: `Zap into ${shortenNumber(collateralAmount - zapAmount, 2)}`,
        ...customEdgeOptions,
      }]
    },
  ]

  const boxProps = { w: { base: baseWidth, lg: '600px' }, h: { base: baseheight, lg: '400px' } }

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
        zoomOnScroll: false,
        zoomOnPinch: false,
        paneMoveable: false,
        elementsSelectable: false,
        panOnScroll: false,
        zoomOnDoubleClick: false,
      }}
      noInteraction={true}
      flowData={links}
      boxProps={boxProps}
    />
  )
};