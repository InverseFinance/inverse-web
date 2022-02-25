import { Flex, Image } from '@chakra-ui/react'

export const LPImg = ({
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
        <Flex alignItems="center" w={`${leftSize+rightSize+rightDeltaX}px`}>
            <Image zIndex="1" borderRadius={'50px'} w={`${leftSize}px`} h={`${leftSize}px`} ignoreFallback={true} src={leftImg} />
            <Image borderRadius={'50px'} transform={`translate3d(${rightDeltaX}px, ${rightDeltaY}px, 0)`} w={`${rightSize}px`} h={`${rightSize}px`} ignoreFallback={true} src={rightImg} />
        </Flex>
    )
}