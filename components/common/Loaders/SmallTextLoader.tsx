import { SkeletonText, SkeletonTextProps } from "@chakra-ui/react"

export const SmallTextLoader = (props: Partial<SkeletonTextProps>) => {
    return <SkeletonText display="inline-block" pt="1" skeletonHeight={2} height={'24px'} width={'100px'} noOfLines={1} overflow="hidden" {...props} />
}