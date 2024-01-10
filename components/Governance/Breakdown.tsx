import { Flex, FlexProps, Stack, Text } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { SkeletonList } from '@app/components/common/Skeleton'
import { useProposalsBreakdown } from '@app/hooks/useProposals'
import { VictoryPie } from 'victory'

export const Breakdown = (containerProps: Partial<FlexProps>) => {
  const { active, passed, failed, isLoading } = useProposalsBreakdown();

  if (isLoading) {
    return (
      <Container contentBgColor="gradient3" {...containerProps}>
        <SkeletonList />
      </Container>
    )
  }  

  return (active+passed+failed) > 0 ? (
    <Container label="Proposals Results" contentBgColor="gradient3"  {...containerProps}>
      <Flex direction="row" align="center" justify="space-around">
        <Flex w="full" align="center" justify="center">
          <VictoryPie
            colorScale={['#fff', '#25C9A1', '#928acc']}
            data={[
              { x: 'Active', y: active },
              { x: 'Passed', y: passed },
              { x: 'Failed', y: failed },
            ]}
            innerRadius={130}
            style={{ labels: { display: 'none' } }}
          />
          <Text position="absolute" color="mainTextColor" fontSize="4xl" fontWeight="semibold">
            {active + passed + failed}
          </Text>
        </Flex>
        <Stack w={48}>
          <Stack direction="row">
            <Text w={'40px'} textAlign="end" fontWeight="bold" whiteSpace="nowrap">
              {active}
            </Text>
            <Text color="mainTextColor" fontWeight="bold" whiteSpace="nowrap">
              Active
            </Text>
          </Stack>
          <Stack direction="row">
            <Text w={'40px'} textAlign="end" fontWeight="bold" whiteSpace="nowrap">
              {passed}
            </Text>
            <Text color="#25C9A1" fontWeight="bold" whiteSpace="nowrap">
              Passed
            </Text>
          </Stack>
          <Stack direction="row">
            <Text w={'40px'} textAlign="end" fontWeight="bold" whiteSpace="nowrap">
              {failed}
            </Text>
            <Text color="#928acc" fontWeight="bold" whiteSpace="nowrap">
              Failed
            </Text>
          </Stack>
        </Stack>
      </Flex>
    </Container>
  ) : (
    <></>
  )
}
