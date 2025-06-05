import { getNetwork, getNetworkImage, isSupportedNetwork } from '@app/util/networks';
import { Image, Tooltip } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { capitalize } from '@app/util/misc';

export const NetworkItem = ({
    chainId,
    ignoreUnsupportedWarning = false,
    isSupported = undefined,
    networkAttribute = 'name',
}: {
    chainId?: string | number,
    ignoreUnsupportedWarning?: boolean,
    isSupported?: boolean,
    networkAttribute?: 'name' | 'coinSymbol' | 'codename' | null,
}) => {
    if (!chainId) { return <></> }
    const network = getNetwork(chainId);

    const image = getNetworkImage(network?.id);
    const _isSupported = isSupported ?? isSupportedNetwork(network?.id);

    return (
        <>
            {
                image && (_isSupported || ignoreUnsupportedWarning) ?
                    <Image src={getNetworkImage(network?.id)} ignoreFallback={true} alt={network?.codename} w={5} h={5} mr="2" />
                    :
                    <Tooltip label="Unsupported Network">
                        <WarningIcon color="warning" w={5} h={5} mr="2" />
                    </Tooltip>
            }
            {network && network[networkAttribute] ? capitalize(network[networkAttribute]) : networkAttribute === null ? null : 'Unknown Network'}
        </>
    )
}

export const NetworkImage = ({
    chainId,
    size = '50px',
}: {
    chainId?: string | number,
    size?: any,
}) => {
    if (!chainId) { return <></> }
    const network = getNetwork(chainId);

    const image = getNetworkImage(network?.id);

    return (
        <>
            {
                image ?
                    <Image src={getNetworkImage(network?.id)} ignoreFallback={true} alt={network?.codename} w={size} h={size} />
                    :
                    null
            }
        </>
    )
}