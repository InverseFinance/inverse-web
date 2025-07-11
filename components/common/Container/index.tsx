import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Box, Flex, FlexProps, ScaleFade, Stack, Text, TextProps } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import { NotifBadge } from '../NotifBadge'
import { useEffect, useState } from 'react'

export type AppContainerProps = Partial<Omit<FlexProps, "right">> & {
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
  defaultCollapse?: boolean,
  headerProps?: FlexProps
  labelProps?: TextProps
}

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
  defaultCollapse = false,
  headerProps,
  labelProps,
  descriptionProps,
  subheader = null,
  ...props
}: AppContainerProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapse);
  const [showImage, setShowImage] = useState(!!image);
  const title = (
    <Flex cursor={collapsable ? 'pointer' : undefined} onClick={collapsable ? () => setCollapsed(!collapsed) : undefined} position="relative" w="fit-content">
      {typeof label === 'string' ? (
        <Text className="heading-font" as="h3" fontSize="xl" fontWeight="bold" position="relative" {...labelProps}>
          {label}{collapsable ? collapsed ? <ChevronRightIcon /> : <ChevronDownIcon /> : null}
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
        <Link href={href} fontSize="sm" fontWeight="medium" isExternal {...descriptionProps}>
          {description} <ExternalLinkIcon />
        </Link>
      ) : typeof description === 'string' ? (
        <Text fontSize="sm" fontWeight="medium" color="secondaryTextColor" {...descriptionProps}>
          {description}
        </Text>
      ) : (
        description
      )}
    </Flex>
  )

  const content = <Flex
    w="full"
    borderRadius={8}
    mt={4}
    p={4}
    // shadow="0 0 20px 2px rgba(0, 0, 0, 0.25)"
    shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)"
    bg={contentBgColor ?? 'containerContentBackground'}
    {...contentProps}
  >
    {children}
  </Flex>

  useEffect(() => {
    setShowImage(!!image)
  }, [image])

  return (
    <Flex w="full" direction="column" p={6} pb={0} color="mainTextColor" {...props}>
      {
        (!!title || !!desc || !!image) &&
        <Flex minH={noPadding ? '' : 14} w="full" justify="space-between" align="flex-end" {...headerProps}>
          <Stack direction="row" align="center" spacing={showImage ? undefined : 0}>
            {!!image && <Box display={showImage ? 'inline-block' : 'none'}>
              {image}
            </Box>}
            {
              (!!title || !!desc) && <Flex direction="column" justify="flex-end">
                {title}
                {desc}
              </Flex>
            }
          </Stack>
          {right}
        </Flex>
      }
      {
        subheader
      }
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
