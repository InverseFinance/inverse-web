import { Banner, Products, Stats } from '@inverse/components/Landing'
import Layout from '@inverse/components/Layout'
import { LandingNav } from '@inverse/components/Navbar'

export const Landing = () => (
  <Layout>
    <LandingNav />
    <Banner />
    <Stats />
    <Products />
  </Layout>
)

export default Landing
