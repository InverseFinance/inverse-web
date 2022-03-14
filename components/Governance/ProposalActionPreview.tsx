import { ProposalFunction } from '@app/types'
import { AbiCoder, commify, FunctionFragment, isAddress } from 'ethers/lib/utils';
import { Stack, Flex, Text, StackProps } from '@chakra-ui/react';
import Link from '@app/components/common/Link'
import { namedAddress } from '@app/util';
import { TOKENS } from '@app/variables/tokens';
import { capitalize } from '@app/util/misc';
import { formatUnits } from 'ethers/lib/utils';
import { getNetworkConfigConstants } from '@app/util/networks';

const { DOLA_PAYROLL, DOLA } = getNetworkConfigConstants();

const HumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const contractKnownToken = target === DOLA_PAYROLL ? TOKENS[DOLA] : TOKENS[target];

    const destinator = namedAddress(callDatas[0]);
    const funName = signature.split('(')[0];
    const symbol = contractKnownToken.symbol;
    
    const amount = `${commify(formatUnits(callDatas[1], contractKnownToken.decimals)).replace(/\.0$/, '')}`;

    let text;

    if(target === DOLA_PAYROLL) {
        text = `Add ${destinator} to the PayRolls with a yearly salary of ${amount} ${symbol}`
    } else if(funName === 'approve') {
        text = `Set ${destinator}'s ${symbol} Allowance to ${amount}`;
    } else {
        text = `${capitalize(funName)} ${amount} ${symbol} to ${destinator}`;
    }

    return (
        <Text mb="2" fontStyle="italic">
            &laquo; {text} &raquo; 
        </Text>
    ) 
}


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
        .split(',');

    const contractKnownToken = target === DOLA_PAYROLL ? TOKENS[DOLA] : TOKENS[target];

    return (
        <Stack w="full" spacing={1} {...props} textAlign="left">
            {
                num ?
                    <Flex fontSize="xs" fontWeight="bold" textTransform="uppercase" color="secondaryTextColor">
                        {`Action ${num}`}
                    </Flex>
                    : null
            }
            <Flex w="full" overflowX="auto" direction="column" bgColor="primary.850" borderRadius={8} p={3}>
                {
                    !!contractKnownToken && <HumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />
                }
                <Flex fontSize="15px">
                    <Link isExternal href={`https://etherscan.io/address/${target}`} color="secondaryTextColor" fontWeight="semibold">
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