import { Box, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@app/util';
import { FlowChart } from '@app/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';
import { NamedAddressBox } from '@app/components/common/NamedAddressBox/NamedAddressBox';
import { NetworkIds } from '@app/types';

const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }

const elementsOptions = {
  yGap: 200,
  xGap: 300,
};

const positions: { [key: string]: { [key: string]: { x: number, y: number } } } = {
  '1': {},
  '250': {},
  '10': {},
  '56': {},
}

export const MultisigsFlowChart = ({
  multisigs,
  chainId,
}: {
  multisigs: {
    address: string, name: string, owners: string[], chainId: NetworkIds,
  }[],
  chainId: NetworkIds,
}) => {
  const [baseWidth, setBaseWidth] = useState('');
  const [baseheight, setBaseHeight] = useState('');
  const [isLargerThan] = useMediaQuery('(min-width: 400px)')

  useEffect(() => {
    setBaseWidth(`${screen.availWidth || screen.width}px`)
    setBaseHeight(`${(screen.availHeight || screen.height) / 2}px`)
  }, [isLargerThan]);

  const ownersNbMultisig: { [key: string]: number } = {};

  multisigs?.forEach(multisig => {
    multisig.owners.forEach(owner => {
      if (ownersNbMultisig[owner]) { ownersNbMultisig[owner] += 1 }
      else ownersNbMultisig[owner] = 1;
    });
  });

  const links = multisigs?.map((multisig, i) => {
    const multisigX = multisig.owners.length * 200 / 2;
    const pos = positions[chainId][multisig.address.toLowerCase()] || { x: multisigX, y: 0 }
    return {
      label: `👥 ${namedAddress(multisig.address)}`,
      id: multisig.address,
      style: primaryStyle,
      ...pos,
      targets: multisig.owners.map((owner, j) => {
        const ownerPos = positions[chainId][owner.toLowerCase()] || {
          x: 100 + j * 200,
          y: 300,
        }
        return {
          label: <NamedAddressBox children={owner} />,
          id: owner,
          linkLabel: '',
          ...ownerPos,
        }
      })
    }
  }) || [];

  const boxProps = { w: { base: baseWidth, lg: '900px' }, h: { base: baseheight, lg: '400px' } }

  if (!baseWidth) {
    return <Box {...boxProps}>&nbsp;</Box>
  }

  return (
    <FlowChart
      chainId={chainId}
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