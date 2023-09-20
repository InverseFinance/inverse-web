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

export const SimmpleBreadcrumbs = ({ breadcrumbs }: { breadcrumbs: BreadcrumbsProps["breadcrumbs"] }) => {
  return (
    <Breadcrumb fontSize="sm" separator={<ChevronRightIcon color="lightAccentTextColor" />} spacing="1">
      {breadcrumbs.map(({ href, label }, i) => (
        <BreadcrumbItem key={i}>
          <Link href={href} passHref legacyBehavior>
            <BreadcrumbLink
              fontWeight={i + 1 !== breadcrumbs.length ? 'medium' : 'semibold'}
              color={i + 1 !== breadcrumbs.length ? 'lightAccentTextColor' : 'mainTextColor'}
              _hover={{ color: 'mainTextColor' }}
            >
              {label}
            </BreadcrumbLink>
          </Link>
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}

export const Breadcrumbs = ({ w, breadcrumbs }: BreadcrumbsProps) => (
  <Flex w="full" justify="center">
    <Flex w={w} pl={6} pt={6}>
      <SimmpleBreadcrumbs breadcrumbs={breadcrumbs} />
    </Flex>
  </Flex>
)
