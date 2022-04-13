import { HStack } from '@chakra-ui/react'
import Tag from './tag'

export default function TagsBar({ tagsCollection }) {
    return (
        <HStack overflowX={{ base: 'auto', lg: 'visible' }} maxWidth="100%">
            {tagsCollection?.items?.map(tag => <Tag key={tag.name} {...tag} />)}
        </HStack>
    )
}