import { Tooltip } from '@chakra-ui/react'
import { InfoOutlineIcon } from '@chakra-ui/icons'

export const InfoTooltip = ({ message }) => {
  return (
    <Tooltip
      label={message}
      fontWeight="medium"
      fontSize="15px"
      p={3}
      borderRadius={8}
      bgColor="purple.900"
      borderColor="purple.700"
      borderWidth={1}
    >
      <InfoOutlineIcon />
    </Tooltip>
  )
}
