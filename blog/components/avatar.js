import { Box, Image, Flex, VStack } from '@chakra-ui/react'
import Link from 'next/link';
import { useContext } from 'react';

import BlogLink from './common/blog-link';
import BlogText from './common/text';
import ContentfulImage from './contentful-image'
import { BlogContext } from '../../pages/_app';

export default function Avatar({ name, picture, title, twitterHandle, size = '60px' }) {
  const { locale } = useContext(BlogContext);
  const url = `/blog/${locale}/author/${encodeURIComponent(name)}`

  return (
    <div className="flex items-center">
      <Box boxSize={size} position="relative" mr="5">
        <Link href={url} legacyBehavior>
          <a href={url}>
            <ContentfulImage
              src={picture.url}
              layout="fill"
              className="rounded-full cursor-pointer"
              alt={name}
            />
          </a>
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
          {
            !!twitterHandle
            &&
            <Flex
              as="a"
              href={`https://twitter.com/${twitterHandle}`}
              alignItems="center"
              fontSize="12px"
              target="_blank"
              cursor="pointer"
            >
              <Image mr="1" src={`/assets/socials/twitter.png`} h="10px" verticalAlign="middle" />
              <BlogText color="#0a8dfe">@{twitterHandle}</BlogText>
            </Flex>
          }
        </VStack>
      }
    </div>
  )
}
