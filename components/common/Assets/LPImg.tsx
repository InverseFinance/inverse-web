import { NetworkIds, Token } from '@app/types'
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { BoxProps, Flex, HStack, Image, ImageProps } from '@chakra-ui/react'
import { MarketImage } from './MarketImage';

export const LPImages = ({
    lpToken,
    chainId = NetworkIds.mainnet,
    includeSubLps = false,
    imgSize = 20,
    imgProps,
    imgContainerProps,
    alternativeDisplay = false,
}: {
    lpToken: Token,
    chainId?: NetworkIds,
    imgSize?: number,
    imgProps?: Partial<ImageProps>,
    imgContainerProps?: Partial<BoxProps>,
    includeSubLps?: boolean,
    alternativeDisplay?: boolean
}) => {
    const subtokens = (lpToken.pairs?.map(address => {
        return CHAIN_TOKENS[chainId][address] || getToken(CHAIN_TOKENS[chainId], address);
    }) || [])
        .filter(t => !!t && (includeSubLps || (!includeSubLps && !t.isLP)))

    if (subtokens?.length === 2 && subtokens[1].symbol === 'DOLA' && subtokens[0].symbol !== 'INV') {
        subtokens.reverse();
    }

    return <HStack spacing="1" {...imgContainerProps}>
        {
            alternativeDisplay ?
                <LpPairImages leftImg={subtokens[0].image} rightImg={subtokens[1].image} leftSize={imgSize} rightSize={imgSize} />
                : subtokens.map(t => {
                    return <MarketImage key={t.address} size={imgSize} image={t.image} protocolImage={t.protocolImage} imgProps={{ borderRadius: '50px', ...imgProps }} />
                })
        }
    </HStack>
}

export const LpPairImages = ({
    leftImg,
    rightImg,
    leftSize = 15,
    rightSize = 15,
    rightDeltaX = -10,
    rightDeltaY = 0,
}: {
    leftImg: string,
    rightImg: string,
    leftSize?: number,
    rightSize?: number,
    rightDeltaX?: number,
    rightDeltaY?: number
}) => {

    return (
        <Flex alignItems="center" w={`${leftSize + rightSize + rightDeltaX}px`}>
            <Image zIndex="1" borderRadius={'50px'} w={`${leftSize}px`} h={`${leftSize}px`} ignoreFallback={true} src={leftImg} />
            <Image borderRadius={'50px'} transform={`translate3d(${rightDeltaX}px, ${rightDeltaY}px, 0)`} w={`${rightSize}px`} h={`${rightSize}px`} ignoreFallback={true} src={rightImg} />
        </Flex>
    )
}