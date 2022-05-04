import { usePublicDraftReviews } from '@app/hooks/useProposals'
import { HStack, Text, VStack } from '@chakra-ui/react';
import { SubmitButton } from '../common/Button'
import Container from '@app/components/common/Container'
import { useNamedAddress } from '@app/hooks/useNamedAddress';
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp';
import { sendDraftReview } from '@app/util/governance';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import Link from '@app/components/common/Link';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { DraftReview } from '@app/types';
import { useEffect, useState } from 'react';

const DraftReviewItem = ({
    review
}: {
    review: DraftReview,
}) => {
    const { addressName } = useNamedAddress(review.reviewer);
    return (
        <HStack w='full' justify="space-between">
            <HStack>
                <Text><CheckIcon color="secondary" mr="1" /> Reviewed by</Text>
                <Link textDecoration="underline" display="inline-block" href={`/governance/delegates/${review.reviewer}`}>
                    {addressName}
                </Link>
            </HStack>
            <Timestamp textAlign="right" timestamp={review.timestamp} format="MMM Do YYYY, hh:mm A" />
        </HStack>
    )
}

export const DraftReviews = ({
    publicDraftId
}: {
    publicDraftId: any,
}) => {
    const { account, library } = useWeb3React<Web3Provider>();
    const { reviews: reviewsData, isLoading } = usePublicDraftReviews(publicDraftId);

    const [reviews, setReviews] = useState(reviewsData);

    useEffect(() => {
        setReviews(reviewsData);
    }, [reviewsData]);

    const onSuccess = (reviews: DraftReview[]) => {
        setReviews(reviews);
    }

    const addReview = async () => {
        return sendDraftReview(library?.getSigner(), publicDraftId, 'ok', '', onSuccess);
    }

    const removeReview = async () => {
        return sendDraftReview(library?.getSigner(), publicDraftId, 'remove', '', onSuccess);
    }

    // const addComment = async () => {
    //     return sendDraftReview(library?.getSigner(), publicDraftId, 'comment');
    // }

    const accountHasReviewedDraft = !isLoading && reviews.find(r => r.reviewer.toLowerCase() === account?.toLowerCase());

    return (
        <Container
            contentBgColor="gradient2"
            label="Proof of Reviews"
            description="Members allowed to make Drafts can sign the fact that they reviewed the Draft Proposal"
        >
            <VStack w='full'>
                {
                    isLoading ?
                        <Text>Loading...</Text>
                        :
                        reviews.length > 0 ?
                            reviews.map(review => {
                                return <DraftReviewItem key={review.reviewer} review={review} />
                            })
                            :
                            <Text>No Proof Of Review yet</Text>
                }
                {
                    !account ? null
                        :
                        !accountHasReviewedDraft ?
                            <SubmitButton themeColor="green.500" w="fit-content" onClick={addReview}>
                                <CheckIcon mr="1" />I Have Reviewed the Proposal
                            </SubmitButton>
                            :
                            <SubmitButton themeColor="orange.400" w="fit-content" onClick={removeReview}>
                                <CloseIcon mr="1" /> Remove My Proof of Review
                            </SubmitButton>
                }
            </VStack>
        </Container>
    )
}