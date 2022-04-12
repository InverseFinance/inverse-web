import { TimeIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/react';
import { format } from 'date-fns'
import { enUS, fr, de } from 'date-fns/locale';
import { useContext } from 'react';
import { BlogContext } from '../../pages/blog/[...slug]';
import { BLOG_THEME } from '../lib/constants';

const locales = {
  fr,
  "en-US": enUS,
  de,
}

export default function DateComponent({ dateString, readtime = 5 }) {
  const { locale } = useContext(BlogContext);
  return (
    <HStack spacing="2" color={BLOG_THEME.colors.activeTextColor}>
      <time dateTime={dateString}>
        {format(new Date(dateString), 'PPP', { locale: locales[locale] || locales["en-US"] })}
      </time>
      <HStack color={BLOG_THEME.colors.activeTextColor}>
        <TimeIcon />
        <Text color={BLOG_THEME.colors.activeTextColor}>{readtime||5} min</Text>
      </HStack>
    </HStack>
  )
}
