import { getNetwork, getNetworkImage, isSupportedNetwork } from '@inverse/config/networks';
import { Image, Tooltip } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

export const NetworkItem = ({ chainId }: { chainId?: string | number }) => {
    if (!chainId) { return <></> }
    const network = getNetwork(chainId);

    const image = getNetworkImage(network?.id)
    const isSupported = isSupportedNetwork(network?.id);

    return (
        <>
            {
                image && isSupported ?
                    <Image src={getNetworkImage(network?.id)} ignoreFallback={true} alt="" w={5} h={5} mr="2" />
                    :
                    <Tooltip label="Unsupported Network">
                        <WarningIcon color="orange.100" w={5} h={5} mr="2" />
                    </Tooltip>
            }
            {network?.name || 'Unknown Network'}
        </>
    )
}