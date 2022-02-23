import { Flex, Skeleton, SkeletonText } from '@chakra-ui/react'

export const SkeletonTitle = (props: any) => (
  <Skeleton w={80} startColor="primary.100" endColor="primary.300" height={8} {...props} />
)

export const SkeletonBlob = (props: any) => (
  <SkeletonText
    w="full"
    startColor="primary.100"
    endColor="primary.300"
    mt="4"
    noOfLines={6}
    spacing="4"
    skeletonHeight={4}
    {...props}
  />
)

export const SkeletonList = () => (
  <Flex w="full" direction="column">
    <Skeleton w="full" startColor="primary.100" endColor="primary.300" height={8} mb={4} />
    <SkeletonText
      w="full"
      startColor="primary.100"
      endColor="primary.300"
      mt="4"
      noOfLines={4}
      spacing="4"
      skeletonHeight={4}
    />
  </Flex>
)
