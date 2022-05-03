import BlogText from './common/text';

export default function PostTitle({ children, ...props }) {
  return (
    <BlogText
      w='full'
      mb="8"
      textAlign="center"
      as="h1"
      fontSize={{ base: '30', lg: '60' }}
      fontWeight="extrabold"
      mx="auto"
      {...props}
    >
      {children}
    </BlogText>
  )
}
