import { ProposalFunction } from '@app/types'
import { AbiCoder, FunctionFragment, isAddress } from 'ethers/lib/utils';
import { Stack, Flex, Text, StackProps } from '@chakra-ui/react';
import Link from '@app/components/common/Link'
import { namedAddress } from '@app/util';

export const ProposalActionPreview = (({
    target,
    signature,
    callData,
    num,
    ...props
}: ProposalFunction & { num?: number } & StackProps) => {
    const callDatas = new AbiCoder()
        .decode(FunctionFragment.from(signature).inputs, callData)
        .toString()
        .split(',')

    return (
        <Stack w="full" spacing={1} {...props} textAlign="left">
            {
                num ?
                    <Flex fontSize="xs" fontWeight="bold" textTransform="uppercase" color="purple.200">
                        {`Action ${num}`}
                    </Flex>
                    : null
            }
            <Flex w="full" overflowX="auto" direction="column" bgColor="purple.850" borderRadius={8} p={3}>
                <Flex fontSize="15px">
                    <Link isExternal href={`https://etherscan.io/address/${target}`} color="purple.200" fontWeight="semibold">
                        {namedAddress(target)}
                    </Link>
                    <Flex>{`.${signature.split('(')[0]}(${!callDatas[0] ? ')' : ''}`}</Flex>
                </Flex>
                <Flex direction="column" fontSize="sm" pl={4} pr={4}>
                    {callDatas.map((data: string, i) =>
                        isAddress(data) ? (
                            <Link isExternal key={i} href={`https://etherscan.io/address/${data}`} whiteSpace="nowrap">
                                {namedAddress(data)}
                                {i + 1 !== callDatas.length ? ',' : ''}
                            </Link>
                        ) : (
                            <Text key={i}>
                                {data}
                                {i + 1 !== callDatas.length ? ',' : ''}
                            </Text>
                        )
                    )}
                </Flex>
                {callDatas[0] && <Text>)</Text>}
            </Flex>
        </Stack>
    )
})