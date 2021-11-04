import { getNetwork, getNetworkImage } from '@inverse/config/networks';
import { Image } from '@chakra-ui/react';

export const NetworkItem = ({ chainId }: { chainId?: string | number }) => {
    if(!chainId) { return <></> }
    const network = getNetwork(chainId);

    const image = getNetworkImage(network.id)

    return (
        <>
            { image ? <Image src={getNetworkImage(network.id)} fallbackSrc={'/assets/networks/unknown.png'} w={5} h={5} mr="2" /> : null }
            {network.name || 'Unknown Network'}
        </>
    )
}