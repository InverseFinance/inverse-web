/* eslint-disable */
import { TEST_IDS } from '@app/config/test-ids';

// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

// TODO : more tests
describe('Landing Page', () => {
  it('should navigate to landing page by default', () => {
    cy.visit('http://localhost:3000')
    cy.shouldTestId(TEST_IDS.announcement, 'exist')
    cy.shouldTestId(TEST_IDS.landing.enterBtn, 'exist')
    cy.shouldTestId(TEST_IDS.landing.learnMore, 'exist')
  })

  it('should lead to /anchor on enter app', () => {
    cy.getByFirstTestId(TEST_IDS.landing.enterBtn)
      .should('have.attr', 'href', '/anchor')
  })

  it('should lead to https://docs.inverse.finance/ on learn more', () => {
    cy.getByFirstTestId(TEST_IDS.landing.learnMore)
      .should('have.attr', 'href', 'https://docs.inverse.finance/')
  })
})
