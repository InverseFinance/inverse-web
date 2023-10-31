import { CopyIcon, DeleteIcon, DownloadIcon, EditIcon, LinkIcon } from '@chakra-ui/icons'
import Link from '@app/components/common/Link'
import { ProposalFunction } from '@app/types'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { removeLocalDraft, saveLocalDraft } from '@app/util/governance'
import { showToast } from '@app/util/notify';
import { HStack, Popover, PopoverTrigger, PopoverContent, PopoverBody, useClipboard } from '@chakra-ui/react'
import { useRouter } from 'next/dist/client/router'
import { useEffect, useState } from 'react';

const icons = {
    'copy': CopyIcon,
    'share': LinkIcon
}
const labels = {
    'copy': 'Copy proposal as a new one',
    'share': 'Copy a sharable link for the current state of this draft',
}

export const ProposalShareLink = ({
    title,
    description,
    functions,
    draftId,
    type = 'copy',
    isPublicDraft = false,
    onSaveSuccess,
}: {
    title: string,
    description: string,
    functions: ProposalFunction[],
    draftId?: number,
    type?: 'copy' | 'share',
    isPublicDraft?: boolean,
    onSaveSuccess?: (draftId?: number) => void
}) => {
    const router = useRouter()
    const proposalLinkData = JSON.stringify({ title, description, functions })
    const [sharableLink, setSharableLink] = useState('')
    const { hasCopied, onCopy } = useClipboard(sharableLink)
    const IconComp = icons[type]

    useEffect(() => {
        if (!router) { return }
        const proposalLinkData = JSON.stringify({ title, description, functions })
        setSharableLink(`${window.location.origin}/governance/propose?isPreview=true&proposalLinkData=${encodeURIComponent(proposalLinkData)}`)
    }, [title, description, functions, router])

    const handleShareLink = () => {
        onCopy()
    }

    const handleSave = async () => {
        const id = await saveLocalDraft(title, description, functions, isPublicDraft ? undefined : draftId);
        if (id) {
            showToast({ status: 'success', title: `Draft "${title.substring(0, 20)}..."`, description: 'Saved locally' })
            if (onSaveSuccess) { onSaveSuccess(id); }
        } else {
            showToast({ status: 'warning', title: 'Draft #' + (id || ''), description: 'Failed to save' })
        }
    }

    const handleRemove = async () => {
        if (!draftId) { return }
        await removeLocalDraft(draftId);
        if (onSaveSuccess) { onSaveSuccess(undefined); }
        showToast({ status: 'success', title: `Draft "${title.substring(0, 20)}..."`, description: 'Draft removed from the local list' })
    }

    return (
        <>
            {
                <HStack ml="3" spacing="2" alignItems="center">
                    {
                        type === 'copy' ? <>
                            <Link display="inline-block" ml="2" mr="1" href={{ pathname: `/governance/propose`, query: { proposalLinkData } }} isExternal>
                                <AnimatedInfoTooltip message={labels[type]}>
                                    <IconComp color="blue.500" fontSize="12px" cursor="pointer" />
                                </AnimatedInfoTooltip>
                            </Link>
                            {
                                isPublicDraft && <Link display="inline-block" pr="2" href={{ pathname: `/governance/drafts/edit/${draftId}` }}>
                                    <AnimatedInfoTooltip message={"Edit the draft"}>
                                        <EditIcon color="blue.500" fontSize="12px" cursor="pointer" />
                                    </AnimatedInfoTooltip>
                                </Link>
                            }
                        </>
                            :
                            <>
                                <Popover isOpen={hasCopied} isLazy={true} placement="bottom">
                                    <PopoverTrigger>
                                        <span>
                                            <AnimatedInfoTooltip message={labels[type]}>
                                                <IconComp color="blue.500" fontSize="12px" cursor="pointer" onClick={handleShareLink} />
                                            </AnimatedInfoTooltip>
                                        </span>
                                    </PopoverTrigger>
                                    <PopoverContent fontSize="14px" width="fit-content" p="1" className="blurred-container info-bg">
                                        <PopoverBody>
                                            <b>Sharable Link Copied !</b>
                                        </PopoverBody>
                                    </PopoverContent>
                                </Popover>
                                <AnimatedInfoTooltip message={"Save the draft locally"}>
                                    <DownloadIcon color="blue.500" fontSize="12px" cursor="pointer" onClick={handleSave} />
                                </AnimatedInfoTooltip>
                                {
                                    draftId && !isPublicDraft && <AnimatedInfoTooltip message={"Remove the draft from the local drafts"}>
                                        <DeleteIcon color="red.500" fontSize="12px" cursor="pointer" onClick={handleRemove} />
                                    </AnimatedInfoTooltip>
                                }
                            </>
                    }
                </HStack>
            }
        </>
    )
}