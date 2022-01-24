import { Flex, ImageProps } from '@chakra-ui/react'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types';
import { UnderlyingItem } from './UnderlyingItem';

const { TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const UnderlyingItemBlock = ({
    symbol,
    imgSize = '15px',
    nameAttribute = 'symbol',
}: {
    symbol: string,
    imgSize?: ImageProps["w"],
    nameAttribute: 'name' | 'symbol'
}) => {
    const token = Object.values(TOKENS).find(t => t.symbol === symbol);
    return <Flex alignItems="center">
        {
            !!token && <UnderlyingItem label={token[nameAttribute]} image={token.image} address={token.address} imgSize={imgSize} imgProps={{ mr: '1' }} />
        }
    </Flex>
}
