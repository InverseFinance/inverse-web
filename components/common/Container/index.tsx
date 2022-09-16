import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Box, Flex, FlexProps, ScaleFade, Stack, Text } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import { NotifBadge } from '../NotifBadge'
import { useEffect, useState } from 'react'

export const Container = ({
  label,
  description,
  href,
  right,
  image,
  noPadding,
  children,
  nbNotif,
  contentBgColor,
  contentProps,
  collapsable = false,
  headerProps,
  ...props
}: Partial<Omit<FlexProps, "right">> & {
  label?: React.ReactNode
  description?: React.ReactNode
  href?: string
  right?: React.ReactNode
  image?: React.ReactNode
  noPadding?: boolean
  nbNotif?: number
  contentBgColor?: FlexProps["bgColor"]
  contentProps?: FlexProps
  children?: React.ReactNode
  collapsable?: boolean,
  headerProps?: FlexProps
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showImage, setShowImage] = useState(!!image);
  const title = (
    <Flex cursor={collapsable ? 'pointer' : undefined} onClick={collapsable ? () => setCollapsed(!collapsed) : undefined} position="relative" w="fit-content">
      {typeof label === 'string' ? (
        <Text as="h3" fontSize="xl" fontWeight="bold" position="relative">
          {label}
        </Text>
      ) : (
        label
      )}
      {
        !!nbNotif && <NotifBadge>{nbNotif}</NotifBadge>
      }
    </Flex>
  )

  const desc = (
    <Flex>
      {href ? (
        <Link href={href} fontSize="sm" fontWeight="medium" isExternal>
          {description} <ExternalLinkIcon />
        </Link>
      ) : typeof description === 'string' ? (
        <Text fontSize="sm" fontWeight="medium" color="secondaryTextColor">
          {description}
        </Text>
      ) : (
        description
      )}
    </Flex>
  )

  const content = <Flex w="full" borderRadius={8} mt={4} p={4} shadow="0 0 20px 2px rgba(0, 0, 0, 0.25)" bg={contentBgColor ?? 'containerContentBackground'} {...contentProps}>
    {children}
  </Flex>

  useEffect(() => {    
    setShowImage(!!image)
  }, [image])

  return (
    <Flex w="full" direction="column" p={6} pb={0} color="mainTextColor" {...props}>
      <Flex minH={noPadding ? '' : 14} w="full" justify="space-between" align="flex-end" {...headerProps}>
        <Stack direction="row" align="center">
          {<Box display={showImage ? 'inline-block' : 'none'}>
            {image}
          </Box>}
          <Flex direction="column" justify="flex-end">
            {title}
            {desc}
          </Flex>
        </Stack>
        {right}
      </Flex>
      {
        collapsable ?
          <ScaleFade in={!collapsed} unmountOnExit={true}>
            {content}
          </ScaleFade>
          : content
      }
    </Flex>
  )
}

export default Container
