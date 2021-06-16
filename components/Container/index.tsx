import { Flex, Text } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import Link from '@inverse/components/Link'

export const Container = ({
  w,
  label,
  description,
  href,
  children,
}: {
  w?: string | number
  label?: React.ReactNode
  description?: React.ReactNode
  href?: string
  children?: React.ReactNode
}) => (
  <Flex w={w} direction="column" p={6} color="#fff">
    {label && (
      <Flex w="full" direction="column" mb={4}>
        {typeof label === 'string' ? (
          <Text fontSize="xl" fontWeight="bold">
            {label}
          </Text>
        ) : (
          label
        )}
        {description &&
          (href ? (
            <Link href={href} fontSize="sm" isExternal>
              {description} <ExternalLinkIcon />
            </Link>
          ) : (
            <Text fontSize="sm">{description}</Text>
          ))}
      </Flex>
    )}
    <Flex w="full" bgColor="#211e36" borderRadius={8} p={4}>
      {children}
    </Flex>
  </Flex>
)

export default Container
