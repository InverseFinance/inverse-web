import { TimeIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import { format } from 'date-fns'
import { enUS, fr, de } from 'date-fns/locale';
import { useContext } from 'react';
import { BlogContext } from '../../pages/_app';
import { BLOG_THEME } from '../lib/constants';
import BlogText from './common/text';

const locales = {
  fr,
  "en-US": enUS,
  de,
}

export default function DateComponent({ dateString, readtime = 5, color = BLOG_THEME.colors.activeTextColor, ...props }) {
  const { locale } = useContext(BlogContext);
  return (
    <HStack spacing="2" color={color} {...props}>
      <time dateTime={dateString}>
        {format(new Date(dateString), 'PPP', { locale: locales[locale] || locales["en-US"] })}
      </time>
      <HStack color={color}>
        <TimeIcon />
        <BlogText color={color}>{readtime||5} min</BlogText>
      </HStack>
    </HStack>
  )
}
