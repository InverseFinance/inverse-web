import { Box, useMediaQuery } from '@chakra-ui/react';
import { namedAddress } from '@inverse/util';
import { FlowChart } from '@inverse/components/common/Dataviz/FlowChart';
import { useEffect, useState } from 'react';
import { NamedAddressBox } from '../common/NamedAddressBox/NamedAddressBox';

const primaryStyle = { backgroundColor: '#5E17EBcc', color: 'white' }

const elementsOptions = {
  yGap: 400,
  xGap: 300,
};

export const MultisigsFlowChart = ({
  multisigs,
}: {
  multisigs: {
    address: string, name: string, owners: string[]
  }[]
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
    const multisigX =  i * 800;
    let singleOwnerAccX = multisigX;
    return {
      label: `👥 ${namedAddress(multisig.address)}`,
      id: multisig.address,
      style: primaryStyle,
      x: multisigX,
      y: 0,
      targets: multisig.owners.map((owner, j) => {
        const isMultiOwner = ownersNbMultisig[owner] > 1;
        const singleOwnerX = singleOwnerAccX;
        if(!isMultiOwner) {
          singleOwnerAccX += 200;
        }
        return {
          label: <NamedAddressBox children={owner} />,
          id: owner,
          linkLabel: '',
          y: ownersNbMultisig[owner] > 1 ? 100 : 400,
          x: ownersNbMultisig[owner] > 1 ? multisigX + 400 : singleOwnerX,
        }
      })
    }
  }) || [];

  const boxProps = { w: { base: baseWidth, lg: '1000px' }, h: { base: baseheight, lg: '600px' } }

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