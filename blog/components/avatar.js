import { Text, VStack } from '@chakra-ui/react'
import { BLOG_THEME } from '../lib/constants'
import ContentfulImage from './contentful-image'

export default function Avatar({ name, picture, title }) {
  return (
    <div className="flex items-center">
      <div className="relative w-12 h-12 mr-4">
        <ContentfulImage
          src={picture.url}
          layout="fill"
          className="rounded-full"
          alt={name}
        />
      </div>
      {
        (!!name || !!title) && <VStack alignItems="flex-start">
          {
            !!name && <Text fontWeight="bold" color={BLOG_THEME.colors.activeTextColor} fontSize="18px">{name}</Text>
          }
          {
            !!title && <Text color={BLOG_THEME.colors.activeTextColor} fontSize="12px">{title}</Text>
          }
        </VStack>
      }
    </div>
  )
}
