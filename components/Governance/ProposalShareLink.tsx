import { CopyIcon, LinkIcon } from '@chakra-ui/icons'
import Link from '@inverse/components/common/Link'
import { ProposalFunction } from '@inverse/types'
import { useRouter } from 'next/dist/client/router'
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'

const icons = {
    'copy': CopyIcon, 
    'share': LinkIcon
}
const labels = {
    'copy': 'Copy proposal as a new one',
    'share': 'Open a sharable link for this draft',
}

export const ProposalShareLink = ({
    title,
    description,
    functions,
    type = 'copy',
}: {
    title: string,
    description: string,
    functions: ProposalFunction[],
    type?: 'copy' | 'share'
}) => {
    const { query } = useRouter()
    const proposalLinkData = JSON.stringify({ title, description, functions })
    const IconComp = icons[type]
    return (
        <Link href={{ pathname: `/governance/propose`, query: { ...(query || {}), proposalLinkData } }} isExternal>
            <AnimatedInfoTooltip message={labels[type]}>
                <IconComp fontSize="12px" cursor="pointer" />
            </AnimatedInfoTooltip>
        </Link>
    )
}