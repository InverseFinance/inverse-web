import { Box } from '@chakra-ui/react'
import Image from 'next/image'

export default function RichTextAsset({ id, assets }) {
  const asset = assets?.find((asset) => asset.sys.id === id)

  if (asset?.url) {
    return <Box maxW={`${asset.width}px`} maxH={`${asset.height}px`}>
      <Image src={asset.url} width={asset.width} height={asset.height} layout={'responsive'} alt={asset.description} />
    </Box>
  }

  return null
}
