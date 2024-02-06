import { SkeletonText, SkeletonTextProps } from "@chakra-ui/react"

export const BigTextLoader = (props: Partial<SkeletonTextProps>) => {
    return <SkeletonText display="inline-block" pt="1" skeletonHeight={4} height={'36px'} width={'130px'} noOfLines={1} overflow="hidden" {...props} />
}