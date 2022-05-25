import { Flex, FlexProps, ImageProps } from '@chakra-ui/react'
import { getNetworkConfigConstants } from '@app/util/networks';
import { UnderlyingItem } from './UnderlyingItem';

const { TOKENS } = getNetworkConfigConstants(process.env.NEXT_PUBLIC_CHAIN_ID!);

export const UnderlyingItemBlock = ({
    symbol,
    imgSize = '15px',
    nameAttribute = 'symbol',
    imgProps,
    ...props
}: {
    symbol: string,
    imgSize?: ImageProps["w"],
    nameAttribute: 'name' | 'symbol'
    imgProps?: ImageProps,
    props?: FlexProps
}) => {
    const token = Object.values(TOKENS).find(t => t.symbol === symbol);
    const backup = Object.values(TOKENS).find(t => t.symbol === symbol.replace('-v1', ''));
    return <Flex alignItems="center" {...props}>
        {
            (!!token || !!backup) && <UnderlyingItem label={token ? token[nameAttribute] : symbol} image={token?.image || backup?.image} address={token?.address || backup?.address} imgSize={imgSize} imgProps={{ mr: '1', ...imgProps }} />
        }
    </Flex>
}
