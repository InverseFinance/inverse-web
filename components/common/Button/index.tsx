import { Button, Flex, Link, ButtonProps } from '@chakra-ui/react'
import { showFailNotif } from '@inverse/util/notify';
import { handleTx } from '@inverse/util/transactions';
import NextLink from 'next/link'
import { useEffect, useState } from 'react';
import { getNetwork } from '../../../config/networks';
import { NetworkItem } from '../NetworkItem';

export const LinkButton = ({
  children,
  href,
  target = '_self',
}: {
  href: string
  children: React.ReactNode
  target: string
}) => (
  <Flex
    w="full"
    justify="center"
    bgColor="purple.500"
    cursor="pointer"
    borderRadius={4}
    p={2}
    _hover={{ bgColor: 'purple.600', transition: 'all 250ms' }}
  >
    <NextLink href={href} passHref>
      <Link color="#fff" fontSize="md" fontWeight="semibold" _hover={{}} target={target} _focus={{}}>
        {children}
      </Link>
    </NextLink>
  </Flex>
)
export const LinkOutlineButton = ({
  children,
  href,
  target = '_self',
}: {
  href: string
  children: React.ReactNode
  target: string
}) => (
  <Flex
    w="full"
    justify="center"
    bgColor="purple.850"
    borderColor="purple.600"
    borderWidth={1}
    cursor="pointer"
    borderRadius={4}
    p={2}
    _hover={{ bgColor: 'purple.600', transition: 'all 250ms' }}
  >
    <NextLink href={href} passHref>
      <Link color="#fff" fontSize="md" fontWeight="semibold" _hover={{}} target={target} _focus={{}}>
        {children}
      </Link>
    </NextLink>
  </Flex>
)

export const StyledButton = (props: ButtonProps) => (
  <SmartButton
    bgColor="purple.500"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    borderRadius={8}
    fontWeight="semibold"
    color="#fff"
    height={8}
    pl={3}
    pr={3}
    _hover={{ bgColor: 'purple.600' }}
    {...props}
  />
)

export const NetworkButton = ({
  chainId,
  onClick,
  ...btnProps
}: {
  chainId: string | number | undefined,
  onClick?: () => void,
  btnProps?: ButtonProps,
}) => {
  if(!chainId) { return <></> }
  const network = getNetwork(chainId);

  return (
    <StyledButton 
    bgColor={network.bgColor || 'purple.500'} 
    onClick={onClick} {...btnProps}
    >
      <NetworkItem chainId={chainId} />
    </StyledButton>
  )
}

export const OutlineButton = (props: any) => (
  <Flex
    justify="center"
    cursor={props.onClick ? 'pointer' : ''}
    fontSize="sm"
    align="center"
    bgColor="purple.800"
    borderRadius={4}
    borderWidth={1}
    borderColor="purple.700"
    fontWeight="semibold"
    color="#fff"
    p={2}
    pl={4}
    pr={4}
    _hover={{ bgColor: 'purple.850' }}
    {...props}
  />
)

/**
 * "Smart" button :
 * If the onClick function returns a Promise, we show a loader and disable the btn while the Promise is pending
 * If it's transaction Promise, we use handleTx to deal with the transaction status and notify the user
 * If there's an error there will be a notification (transaction case or not)
 *  **/
export const SmartButton = (props: ButtonProps) =>{
  const [isPending, setIsPending] = useState(false);
  const [loadingText, setLoadingText] = useState(props.loadingText || props?.children?.toString());

  useEffect(() => {
    setLoadingText(props.loadingText || props?.children?.toString());
  }, [props.loadingText, props.children]);

  // wraps the onClick function given to handle promises/transactions automatically
  const handleClick = async (e: any) => {
    if(!props.onClick){ return }

    const returnedValueFromClick: any = props.onClick(e);
    if(!returnedValueFromClick) { return }

    // click returns a Promise
    if(returnedValueFromClick?.then) {
      // when pending disable btn and show loader in btn
      setIsPending(true);

      try {
        const promiseResult = await returnedValueFromClick;
        // it's a TransactionResponse => handle tx status
        if(promiseResult?.hash){
          await handleTx(promiseResult);
        }
      } catch (e) {
        showFailNotif(e)
      }

      setIsPending(false);
    }
  }

  return (
    <Button
      loadingText={loadingText}
      {...props}
      // keep after {...props} :
      disabled={props.disabled || props.isDisabled || isPending}
      onClick={handleClick}
      isLoading={props.isLoading || isPending}
    />
  )
}

export const SubmitButton = (props: ButtonProps) => {
  return (
    <SmartButton
      w="full"
      bgColor="purple.600"
      fontSize="13px"
      fontWeight="semibold"
      textTransform="uppercase"
      _focus={{}}
      _hover={{ bgColor: 'purple.700' }}
      {...props}
    />
  )
}

type NavButtonProps = {
  onClick: (s: any) => void
  active: string
  options: string[]
}

export const NavButtons = ({ options, active, onClick }: NavButtonProps) => (
  <Flex w="full" bgColor="purple.850" p={1} borderRadius={4} cursor="pointer">
    {options.map((option: string) => (
      <Flex
        key={option}
        w="full"
        justify="center"
        p={2}
        borderRadius={4}
        fontWeight="semibold"
        fontSize="15px"
        color={option === active ? '#fff' : 'purple.200'}
        onClick={() => onClick(option)}
        bgColor={option === active ? 'purple.650' : 'purple.850'}
      >
        {option}
      </Flex>
    ))}
  </Flex>
)

export default LinkButton
