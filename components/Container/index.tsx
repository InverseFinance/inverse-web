import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Stack, Text } from '@chakra-ui/react'
import Link from '@inverse/components/Link'

export const Container = ({
  label,
  description,
  href,
  right,
  image,
  noPadding,
  children,
}: {
  label?: React.ReactNode
  description?: React.ReactNode
  href?: string
  right?: React.ReactNode
  image?: React.ReactNode
  noPadding?: boolean
  children?: React.ReactNode
}) => {
  const title = (
    <Flex>
      {typeof label === 'string' ? (
        <Text fontSize="xl" fontWeight="bold">
          {label}
        </Text>
      ) : (
        label
      )}
    </Flex>
  )

  const desc = (
    <Flex>
      {href ? (
        <Link href={href} fontSize="sm" fontWeight="medium" isExternal>
          {description} <ExternalLinkIcon />
        </Link>
      ) : typeof description === 'string' ? (
        <Text fontSize="sm" fontWeight="medium" color="purple.200">
          {description}
        </Text>
      ) : (
        description
      )}
    </Flex>
  )

  return (
    <Flex w="full" direction="column" p={6} pb={0} color="#fff">
      <Flex minH={noPadding ? '' : 14} w="full" justify="space-between" align="flex-end">
        <Stack direction="row" align="center">
          {image}
          <Flex direction="column" justify="flex-end">
            {title}
            {desc}
          </Flex>
        </Stack>
        {right}
      </Flex>
      <Flex w="full" bgColor="purple.800" borderRadius={8} mt={4} p={4} shadow="dark-lg">
        {children}
      </Flex>
    </Flex>
  )
}

export default Container
