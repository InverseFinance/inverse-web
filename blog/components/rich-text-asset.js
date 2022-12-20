import { Box } from '@chakra-ui/react'
import ContentfulImage from './contentful-image'

export default function RichTextAsset({ id, assets }) {
  const asset = assets?.find((asset) => asset.sys.id === id)

  if (asset?.url) {
    return <Box maxW={`${asset.width}px`} maxH={`${asset.height}px`}>
      <ContentfulImage src={asset.url} width={asset.width} height={asset.height} layout={'responsive'} alt={asset.description} />
    </Box>
  }

  return null
}
