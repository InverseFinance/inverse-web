import { Box } from '@chakra-ui/react'

export const Newsletter = () => {
    return <Box overflow="hidden" h="250px">
        <iframe
            src="https://inversestarship.substack.com/embed"
            width="100%"
            height="320"
            frameBorder="0"
            allowTransparency={true}
            style={{ transform: 'translateY(-30px)' }}
            scrolling="no"></iframe>
    </Box>
}