import { ProposalFunction, NetworkIds } from '@inverse/types'
import { AbiCoder, FunctionFragment, isAddress } from 'ethers/lib/utils';
import { Stack, Flex, Text, StackProps } from '@chakra-ui/react';
import Link from '@inverse/components/common/Link'
import { getNetworkConfigConstants } from '@inverse/config/networks';

const { CONTRACTS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const ProposalActionPreview = (({ target, signature, callData, num, ...props }: ProposalFunction & { num?: number } & StackProps) => {
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
                    <Link href={`https://etherscan.io/address/${target}`} color="purple.200" fontWeight="semibold">
                        {CONTRACTS[target] || target}
                    </Link>
                    <Flex>{`.${signature.split('(')[0]}(${!callDatas[0] ? ')' : ''}`}</Flex>
                </Flex>
                <Flex direction="column" fontSize="sm" pl={4} pr={4}>
                    {callDatas.map((data: string, i) =>
                        isAddress(data) ? (
                            <Link key={i} href={`https://etherscan.io/address/${data}`} whiteSpace="nowrap">
                                {CONTRACTS[data] || data}
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