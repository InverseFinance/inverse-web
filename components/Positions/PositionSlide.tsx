import { AccountPositionDetailed } from '@app/types'
import { CloseIcon } from '@chakra-ui/icons'
import { Box, Slide } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { PositionDetails } from './PositionDetails'

export const PositionSlide = ({
    isOpen,
    onClose,
    position,
    needFresh = true,
}: {
    isOpen: boolean,
    onClose: () => void,
    position: AccountPositionDetailed,
    needFresh?: boolean
}) => {
    return <Slide direction='bottom' in={isOpen} style={{ zIndex: 9999 }}>
        <Container
            noPadding
            contentProps={{
                boxShadow: "0px 0px 1px 1px #ccc",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                className: "blurred-container info-bg",
            }}
        >
            <Box w="15px" h="15px" cursor="pointer" onClick={() => {
                console.log('click')
                onClose()
            }} zIndex="999" position="absolute" top="10px" left="10px">
                <CloseIcon fontSize="14px" cursor="pointer" />
            </Box>
            {!!position && <PositionDetails needFresh={needFresh} position={position} />}
        </Container>
    </Slide>
}