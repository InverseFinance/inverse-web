import { useNbUnseenLiquidations } from "@app/hooks/useLiquidations";
import { Badge, BadgeProps } from '@chakra-ui/react';

export const LiquidationsBadge = ({
  account,
  ...props
}: {
  account: string | null,
} & Partial<BadgeProps>) => {
  const nb = useNbUnseenLiquidations(account);
  if (!nb) {
    return <></>;
  }
  return <Badge bgColor="error" color="mainTextColor" {...props}>
    {nb}
  </Badge>
}
