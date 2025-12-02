import { useProofOfReviews } from '@app/hooks/useProposals'
import { HStack, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverHeader, PopoverTrigger, Stack, Text, useDisclosure, VStack } from '@chakra-ui/react';
import Container from '@app/components/common/Container'
import { useNamedAddress } from '@app/hooks/useNamedAddress';
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp';
import { sendDraftReview } from '@app/util/governance';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import Link from '@app/components/common/Link';
import { ChatIcon, CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { DraftReview, GovEra } from '@app/types';
import { useEffect, useState } from 'react';
import PromptModal from '@app/components/common/Modal/PromptModal';
import { RSubmitButton } from '../common/Button/RSubmitButton';

const ReviewItem = ({
    review
}: {
    review: DraftReview,
}) => {
    const { addressName } = useNamedAddress(review.reviewer);

    const commentPreview = <Text cursor={ !!review.comment ? 'pointer' : '' } noOfLines={1} w='full' maxW="500px" textAlign="left" fontStyle="italic" color="secondaryTextColor">
        <ChatIcon mr="2" color={!!review.comment ? 'info' : 'gray'} />
        {review.comment || 'No Comment'}
    </Text>;

    return (
        <HStack w='full' justify="space-between">
            <VStack spacing="0" alignItems="flex-start">
                <HStack alignItems="flex-start">
                    <Text w='full'><CheckIcon color="secondary" mr="1" /> Reviewed by</Text>
                    <Link textDecoration="underline" display="inline-block" href={`/governance/delegates/${review.reviewer}`}>
                        {addressName}
                    </Link>
                </HStack>
                {
                    !!review.comment ? <Popover trigger="hover" isLazy={true}>
                        <PopoverTrigger>
                            {commentPreview}
                        </PopoverTrigger>
                        <PopoverContent bgColor="navBarBorderColor" _focus={{ outline: 'none' }}>
                            <PopoverArrow />
                            <PopoverHeader border="0">
                                <Text fontWeight="bold" color="mainTextColor">Comment:</Text>
                            </PopoverHeader>
                            <PopoverBody>
                                <Text fontSize="12px" fontStyle="italic" color="mainTextColor">{review.comment || 'No Comment'}</Text>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                    : commentPreview
                }
            </VStack>
            <Timestamp text2Props={{ color: 'secondaryTextColor' }} textAlign="right" timestamp={review.timestamp} format="MMM Do YYYY, hh:mm A" />
        </HStack>
    )
}

export const ProofOfReviews = ({
    id,
    isDraft = true,
    era,
}: {
    id: any,
    isDraft: boolean,
    era?: GovEra,
}) => {
    const { account, provider } = useWeb3React<Web3Provider>();
    const { reviews: reviewsData, isLoading } = useProofOfReviews(id, isDraft, era);
    const { isOpen, onClose, onOpen } = useDisclosure();

    const [reviews, setReviews] = useState(reviewsData);

    useEffect(() => {
        setReviews(reviewsData);
    }, [reviewsData]);

    const onSuccess = (reviews: DraftReview[]) => {
        setReviews(reviews);
        onClose();
    }

    const addReview = async () => {
        onOpen();
    }

    const sendProofOfReview = (comment: string) => {
        return sendDraftReview(provider?.getSigner(), id, 'ok', comment, onSuccess);
    }

    const removeReview = async () => {
        return sendDraftReview(provider?.getSigner(), id, 'remove', '', onSuccess);
    }

    const myReview = reviews?.find(r => r.reviewer.toLowerCase() === account?.toLowerCase());
    const accountHasReviewedDraft = !isLoading && !!myReview;

    return (
        <Container
            contentBgColor="gradient2"
            label="Proof of Reviews"
            description="Members allowed to make Drafts can sign the fact that they reviewed the Draft Proposal"
        >
            <PromptModal
                title="Proof of Review"
                label="Comment"
                placeholder="Optional"
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={sendProofOfReview}
                defaultText={myReview?.comment}
                btnLabel="Send Proof Of Review"
            />
            <VStack w='full'>
                {
                    isLoading ?
                        <Text>Loading...</Text>
                        :
                        reviews.length > 0 ?
                            reviews.map(review => {
                                return <ReviewItem key={review.reviewer} review={review} />
                            })
                            :
                            <Text>No Proof Of Review yet</Text>
                }
                {
                    !account || !isDraft ? null
                        :
                        !accountHasReviewedDraft ?
                            <RSubmitButton themeColor="green.500" w="fit-content" onClick={addReview}>
                                <CheckIcon mr="1" />I Have Reviewed the Proposal
                            </RSubmitButton>
                            :
                            <Stack direction={{ base: 'column', lg: 'row' }}>
                                <RSubmitButton themeColor="blue.500" w="fit-content" onClick={addReview}>
                                    <EditIcon mr="1" />Edit my Review
                                </RSubmitButton>
                                <RSubmitButton themeColor="orange.400" w="fit-content" onClick={removeReview}>
                                    <CloseIcon mr="1" /> Remove My Proof of Review
                                </RSubmitButton>
                            </Stack>
                }
            </VStack>
        </Container>
    )
}