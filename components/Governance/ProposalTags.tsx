import { namedAddress } from '@app/util';
import { getProposalActionFromFunction } from '@app/util/governance'
import { Box, Text } from '@chakra-ui/react'
import ScannerLink from '@app/components/common/ScannerLink';
import { ProposalFunction } from '@app/types';

const Tag = ({
    name,
    address,
    onTagSelect,
}: {
    name: string,
    address: string,
    onTagSelect?: ({ name, address }) => void,
}) => {
    if(onTagSelect) {
        const handleSelect = (e) => {
            e.preventDefault();
            onTagSelect({ name, address });
        }
        return <Text _hover={{ color: 'mainTextColor' }} display="inline-block" mr="2" whiteSpace="nowrap" color="secondaryTextColor" cursor="pointer" onClick={handleSelect}>#{name}</Text>
    }
    return <ScannerLink mr="2" whiteSpace="nowrap" color="secondaryTextColor" chainId="1" value={address} label={`#${name}`} style={{ textDecoration: 'none' }} />
}

export const getProposalTags = (functions: ProposalFunction[]) => {
    const actions = functions.map(f => getProposalActionFromFunction(0, f));
    const uniqueAddresses = [
        ...new Set(
            actions.map(action => {
                return [
                    action.contractAddress.toLowerCase(),
                    ...action.args.filter(arg => arg.type === 'address').map(arg => arg.value.toLowerCase())
                ]
            }).flat()
        )
    ];

    const uniqueNames = uniqueAddresses
        .map(a => ({
            name: namedAddress(a, "1", "n/a").replace(' Working Group', 'WG').replace(/\s/g, ''),
            address: a,
        }))
        .filter(v => v.name !== "n/a");

    uniqueNames.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

    return uniqueNames;
}

export const ProposalTags = ({ functions, onTagSelect, ...props }: { 
    functions: ProposalFunction[],
    onTagSelect?: (tag: { name: string, address: string }) => void,
 }) => {
    const uniqueNames = getProposalTags(functions);

    if(!uniqueNames.length) {
        return <></>
    }

    return <Box overflow="auto" {...props}>
        {uniqueNames.map(v => <Tag key={v.address} name={v.name} address={v.address} onTagSelect={onTagSelect} />)}
    </Box>
}