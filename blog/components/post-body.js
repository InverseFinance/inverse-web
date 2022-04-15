import { Box } from '@chakra-ui/react'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES } from '@contentful/rich-text-types'
import markdownStyles from './markdown-styles.module.css'
import RichTextAsset from './rich-text-asset'

const IframeContainer = ({ children }) => {
  return (
    <Box pb="56.25%" position="relative" display="block" w='full'>
      {children}
    </Box>
  )
}

const customMarkdownOptions = (content) => ({
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => (
      <RichTextAsset
        id={node.data.target.sys.id}
        assets={content.links.assets.block}
      />
    ),
    [INLINES.HYPERLINK]: (node) => {
      if ((node.data.uri).includes("player.vimeo.com/video")) {
        return <IframeContainer><iframe src={node.data.uri} frameBorder="0" allowFullScreen></iframe></IframeContainer>
      } else if ((node.data.uri).includes("youtube.com/embed")) {
        return <IframeContainer><iframe src={node.data.uri} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" frameBorder="0" allowFullScreen></iframe></IframeContainer>
      } else {
        return <a href={node.data.uri} target="_blank">{node.content[0].value}</a>
      }
    },
  },
})

export default function PostBody({ content }) {
  return (
    <div className="max-w-4xl mx-auto blog-post-body">
      <div className={markdownStyles['markdown']}>
        {documentToReactComponents(
          content.json,
          customMarkdownOptions(content)
        )}
      </div>
    </div>
  )
}
