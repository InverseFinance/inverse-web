/* eslint-disable */
import { TEST_IDS } from '@inverse/config/test-ids';

// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

// TODO : more tests
describe('Governance Page', () => {
  it('should navigate to governance page', () => {
    cy.visit('http://localhost:3000/governance')
    cy.shouldTestId(TEST_IDS.announcement, 'exist')
  })
})
