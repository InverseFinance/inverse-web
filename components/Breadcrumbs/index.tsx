import { ChevronRightIcon } from '@chakra-ui/icons'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex } from '@chakra-ui/react'
import Link from 'next/link'

type BreadcrumbsProps = {
  w: string | number
  breadcrumbs: {
    href: string
    label: string
  }[]
}

export const Breadcrumbs = ({ w, breadcrumbs }: BreadcrumbsProps) => (
  <Flex w="full" justify="center">
    <Flex w={w} pl={6} pt={6}>
      <Breadcrumb fontSize="sm" separator={<ChevronRightIcon color="purple.100" />} spacing="1">
        {breadcrumbs.map(({ href, label }, i) => (
          <BreadcrumbItem key={label}>
            <Link href={href} passHref>
              <BreadcrumbLink
                fontWeight={i + 1 !== breadcrumbs.length ? 'medium' : 'semibold'}
                color={i + 1 !== breadcrumbs.length ? 'purple.100' : '#fff'}
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
