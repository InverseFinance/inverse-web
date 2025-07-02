import { namedAddress } from '@app/util';
import { getProposalActionFromFunction } from '@app/util/governance'
import { Box, Text } from '@chakra-ui/react'
import ScannerLink from '@app/components/common/ScannerLink';
import { ProposalFunction } from '@app/types';
import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon, ChevronUpIcon } from '@chakra-ui/icons';

const Tag = ({
    name,
    address,
    onTagSelect,
}: {
    name: string,
    address: string,
    onTagSelect?: ({ name, address }) => void,
}) => {
    if (onTagSelect) {
        const handleSelect = (e) => {
            e.preventDefault();
            onTagSelect({ name, address });
        }
        return <Text  _hover={{ color: 'mainTextColor' }} display="inline-block" mr="2" whiteSpace="nowrap" color="secondaryTextColor" cursor="pointer" onClick={handleSelect}>#{name}</Text>
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

const maxTagsForMore = 5;

export const ProposalTags = ({ functions, onTagSelect, ...props }: {
    functions: ProposalFunction[],
    onTagSelect?: (tag: { name: string, address: string }) => void,
}) => {
    const [showMore, setShowMore] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isInited, setIsInited] = useState(false);
    const ref =  useRef();
    const uniqueNames = getProposalTags(functions);

    useEffect(() => {
        if(!isInited && ref?.current && uniqueNames.length > 0) {
            setIsOverflowing(ref.current?.scrollWidth > ref.current?.clientWidth);
            setIsInited(true);
        }
    }, [uniqueNames, isInited, ref.current]);

    if (!uniqueNames.length) {
        return <></>
    }

    return <Box w="full" position="relative" {...props}>
        <Box color="secondaryTextColor" textOverflow="ellipsis" maxHeight={showMore ? 'auto' : '1.5em'} ref={ref} whiteSpace={showMore ? 'normal' : 'nowrap'} overflow={showMore ? 'auto' : 'hidden'}  w="full">
            {uniqueNames.map(v => <Tag key={v.address} name={v.name} address={v.address} onTagSelect={onTagSelect} />)}
        </Box>
        {isOverflowing && <Text textDecoration="underline" fontSize="sm" cursor="pointer" onClick={() => setShowMore(!showMore)}>{showMore ? <>Show less <ChevronUpIcon /></> : <>Show more <ChevronRightIcon /></>}</Text>}
    </Box>
}