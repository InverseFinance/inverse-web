import {
    Tooltip
  } from '@chakra-ui/react'
  import { InfoOutlineIcon } from '@chakra-ui/icons'

export const InfoTooltip = ({message}) => {
    return (
        <Tooltip label={message} fontSize="md">
            <InfoOutlineIcon />
        </Tooltip>
    )
}