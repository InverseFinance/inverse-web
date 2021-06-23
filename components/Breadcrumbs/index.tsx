import { ChevronRightIcon } from '@chakra-ui/icons'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex } from '@chakra-ui/react'
import Link from 'next/link'

export const Breadcrumbs = ({ breadcrumbs }: any) => (
  <Flex w="full" justify="center">
    <Flex w="80rem" pl={6} pt={6}>
      <Breadcrumb fontSize="sm" separator={<ChevronRightIcon color="purple.100" />} spacing="1">
        {breadcrumbs.map(({ href, label }: any, i: number) => (
          <BreadcrumbItem key={label}>
            <Link href={href} passHref>
              <BreadcrumbLink
                fontWeight="semibold"
                color={i + 1 === breadcrumbs.length ? 'purple.100' : '#fff'}
                _hover={{ color: 'purple.100' }}
              >
                {label}
              </BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    </Flex>
  </Flex>
)
