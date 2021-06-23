import { ChevronRightIcon } from '@chakra-ui/icons'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex } from '@chakra-ui/react'
import Link from 'next/link'

export const Breadcrumbs = ({ breadcrumbs }: any) => (
  <Flex w="full" justify="center">
    <Flex w="77rem" mt={6}>
      <Breadcrumb color="#fff" fontSize="sm" fontWeight="medium" separator={<ChevronRightIcon color="purple.100" />}>
        {breadcrumbs.map(({ href, label }: any) => (
          <BreadcrumbItem>
            <Link href={href} passHref>
              <BreadcrumbLink _hover={{ color: 'purple.100' }}>{label}</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    </Flex>
  </Flex>
)
