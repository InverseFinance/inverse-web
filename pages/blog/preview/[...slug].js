import BlogHome from '../../../blog/components/page-layouts/blog-home';
import { getBlogHomeProps } from '../../../blog/lib/utils';

export default function BlogHomeSSR(props) {
  return BlogHome(props)
}

// revalidation via webhook
export async function getServerSideProps(context) {
  return getBlogHomeProps(context)
}
