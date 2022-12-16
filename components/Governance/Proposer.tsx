import { NetworkIds } from '@app/types'
import { namedAddress } from '@app/util'
import { Stack } from '@chakra-ui/react'
import { Avatar } from '../common/Avatar'
import Link from '../common/Link'

export const Proposer = ({ proposer }: { proposer: string }) => {
    return <Stack direction="row" align="center">
        <Avatar address={proposer} sizePx={20} />
        <Link fontWeight="bold" color="secondaryTextColor" fontSize="sm" href={`/governance/delegates/${proposer}`}>
            {namedAddress(proposer, NetworkIds.mainnet)}
        </Link>
    </Stack>
}