import { TimeIcon } from '@chakra-ui/icons';
import { HStack } from '@chakra-ui/react';
import { BLOG_THEME } from '../lib/constants';
import BlogText from './common/text';
import { formatDateWithTime } from '@app/util/time';

export default function DateComponent({ dateString, readtime = 5, color = BLOG_THEME.colors.activeTextColor, ...props }) {
  return (
    <HStack spacing="2" color={color} {...props}>
      <time dateTime={dateString}>
        {formatDateWithTime(new Date(dateString))}
      </time>
      <HStack color={color}>
        <TimeIcon />
        <BlogText color={color}>{readtime||5} min</BlogText>
      </HStack>
    </HStack>
  )
}
