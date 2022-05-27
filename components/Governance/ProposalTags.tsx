import { namedAddress } from '@app/util';
import { getProposalActionFromFunction } from '@app/util/governance'
import { Box } from '@chakra-ui/react'
import ScannerLink from '@app/components/common/ScannerLink';

const Tag = ({
    name,
    address,
}: {
    name: string,
    address: string,
}) => {
    return <ScannerLink mr="2" whiteSpace="nowrap" color="secondaryTextColor" chainId="1" value={address} label={`#${name}`} style={{ textDecoration: 'none' }} />
}

export const ProposalTags = ({ functions, ...props }: { functions: any[] }) => {
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
            name: namedAddress(a, "1", "n/a").replace(' Working Group', 'WG'),
            address: a,
        }))
        .filter(v => v.name !== "n/a");

    uniqueNames.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

    if(!uniqueNames.length) {
        return <></>
    }

    return <Box overflow="auto" {...props}>
        {uniqueNames.map(v => <Tag name={v.name} address={v.address} />)}
    </Box>
}