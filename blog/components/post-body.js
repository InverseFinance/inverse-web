import { Box } from '@chakra-ui/react'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES } from '@contentful/rich-text-types'
import { useEffect } from 'react'
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
      } else if ((node.data.uri).includes("youtube.com/watch") && !!node.data.uri.match(/v=([A-Za-z0-9]+)/)) {
        const videoId = node.data.uri.match(/v=([A-Za-z0-9]+)/)[1]
        const embedUri = `https://youtube.com/embed/${videoId}`
        return <IframeContainer><iframe src={embedUri} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" frameBorder="0" allowFullScreen></iframe></IframeContainer>
      } else if (node.data.uri.includes('https://twitter.com') && node.data.uri.includes('/status/')) {
        const xLink = node.data.uri.replace(/(https:\/\/twitter\.com\/)([a-zA-Z0-9]+)/i, '$1x');
        return <blockquote className="twitter-tweet" style={{ width: '100%', border: '1px solid red' }}>
          <a href={`${xLink}`}>{xLink}</a>
        </blockquote>
      } else {
        return <a href={node.data.uri} target="_blank">{node.content[0].value}</a>
      }
    },
  },
})

export default function PostBody({ content }) {

  useEffect(() => {
    const script = document.createElement('script');

    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

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
