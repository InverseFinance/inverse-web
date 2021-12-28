import { CopyIcon, DownloadIcon, LinkIcon } from '@chakra-ui/icons'
import Link from '@inverse/components/common/Link'
import { ProposalFunction } from '@inverse/types'
import { useRouter } from 'next/dist/client/router'
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { saveLocalDraft } from '@inverse/util/governance'
import { showToast } from '@inverse/util/notify';

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

    const handleSave = async () => {
        const draftId = await saveLocalDraft(title, description, functions);
        if(draftId) {
            showToast({ status: 'success', title: 'Proposal Draft #'+draftId, description: 'Saved locally' })
        } else {
            showToast({ status: 'warning', title: 'Proposal Draft #'+draftId, description: 'Failed to save' })
        }
    }

    return (
        <>
            <Link mx='2' href={{ pathname: `/governance/propose`, query: { ...(query || {}), proposalLinkData } }} isExternal>
                <AnimatedInfoTooltip message={labels[type]}>
                    <IconComp fontSize="12px" cursor="pointer" />
                </AnimatedInfoTooltip>
            </Link>
            {
                type === 'share' &&
                <AnimatedInfoTooltip message={"Save the draft in my browser cache"}>
                    <DownloadIcon fontSize="12px" cursor="pointer" onClick={handleSave} />
                </AnimatedInfoTooltip>
            }
        </>
    )
}