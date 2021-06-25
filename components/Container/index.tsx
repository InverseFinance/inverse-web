import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Text } from '@chakra-ui/react'
import Link from '@inverse/components/Link'

export const Container = ({
  label,
  description,
  href,
  right,
  noPadding,
  children,
}: {
  label?: React.ReactNode
  description?: React.ReactNode
  href?: string
  right?: React.ReactNode
  noPadding?: boolean
  children?: React.ReactNode
}) => (
  <Flex w="full" direction="column" p={6} pb={0} color="#fff">
    <Flex minH={noPadding ? '' : 14} w="full" justify="space-between" align="flex-end">
      <Flex direction="column" justify="flex-end">
        {label ? (
          typeof label === 'string' ? (
            <Text fontSize="xl" fontWeight="bold">
              {label}
            </Text>
          ) : (
            label
          )
        ) : (
          <></>
        )}
        {description ? (
          href ? (
            <Flex>
              <Link href={href} fontSize="sm" isExternal>
                {description} <ExternalLinkIcon />
              </Link>
            </Flex>
          ) : typeof description === 'string' ? (
            <Text fontSize="sm">{description}</Text>
          ) : (
            description
          )
        ) : (
          <></>
        )}
      </Flex>
      {right}
    </Flex>
    <Flex w="full" bgColor="#211e36" borderRadius={8} mt={4} p={4}>
      {children}
    </Flex>
  </Flex>
)

export default Container
