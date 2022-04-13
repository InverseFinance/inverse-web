import BlogText from './common/text';

export default function PostTitle({ children }) {
  return (
    <BlogText
      w='full'
      mb="8"
      textAlign="center"
      as="h1"
      fontSize={{ base: '30', sm: '40', lg: '60' }}
      fontWeight="extrabold">
      {children}
    </BlogText>
  )
}
