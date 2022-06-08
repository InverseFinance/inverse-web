import { FlowChartData, Market, Token } from '@app/types';

import { Box, useMediaQuery } from '@chakra-ui/react';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';
import { UnderlyingItem } from '../common/Assets/UnderlyingItem';
import { shortenNumber } from '@app/util/markets';

const blueStyle = { backgroundColor: '#4299e1cc', color: 'white' }
const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }
const greenStyle = { backgroundColor: '#25C9A1cc', color: 'white' }

const elementsOptions = {
  yGap: 150,
};

const ItemLabel = ({ underlying, amount }) => {
  return <UnderlyingItem
    imgContainerProps={{ mr: '2' }}
    label={`${shortenNumber(amount, 2)} ${underlying.symbol}`}
    image={underlying.image}
    protocolImage={underlying.protocolImage} />
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
    id: borrowedToken.address,
    linkLabel: `Borrow ${shortenNumber(borrowedAmount, 2)}`
  }];

  if (collateral.symbol !== inputToken.symbol) {
    engineTargets.unshift({
      id: collateral.address,
      linkLabel: `Zap into ${shortenNumber(zapAmount, 2)}`,
    })
  }

  const links: FlowChartData[] = [
    {
      label: <ItemLabel underlying={inputToken} amount={inputAmount} />,
      id: 'inputToken',
      style: blueStyle,
      targets: [{
        label: 'Engine',
        id: 'engine',
        linkLabel: `Deposit`,
        style: primaryStyle,
      }]
    },
    {
      label: <ItemLabel underlying={collateral} amount={collateralAmount} />,
      id: collateral.address,
      style: greenStyle,
    },
    {
      label: "Engine",
      id: 'engine',
      style: primaryStyle,
      targets: engineTargets,
    },
    {
      label: <ItemLabel underlying={borrowedToken} amount={borrowedAmount} />,
      id: borrowedToken.address,
      style: blueStyle,
      targets: [{
        id: collateral.address,
        linkLabel: `Zap into ${shortenNumber(collateralAmount - zapAmount, 2)}`,
      }]
    },
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