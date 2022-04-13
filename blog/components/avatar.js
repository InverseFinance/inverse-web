import { Box, Text, VStack } from '@chakra-ui/react'
import Link from 'next/link';
import { useContext } from 'react';
import { BlogContext } from '../../pages/blog/[...slug]';
import BlogLink from './common/blog-link';
import BlogText from './common/text';
import ContentfulImage from './contentful-image'

export default function Avatar({ name, picture, title, size = '60px' }) {
  const { locale } = useContext(BlogContext);
  const url = `/blog/${locale}?byAuthor=${encodeURIComponent(name)}`

  return (
    <div className="flex items-center">
      <Box boxSize={size} position="relative" mr="5">
        <Link href={url}>
          <ContentfulImage
            src={picture.url}
            layout="fill"
            className="rounded-full cursor-pointer"
            alt={name}
          />
        </Link>
      </Box>
      {
        (!!name || !!title) && <VStack alignItems="flex-start" >
          {
            !!name &&
            <BlogLink href={url} fontSize="18px">
              {name}
            </BlogLink>
          }
          {
            !!title && <BlogText fontSize="12px">{title}</BlogText>
          }
        </VStack>
      }
    </div>
  )
}
