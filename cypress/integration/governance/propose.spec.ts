/* eslint-disable */
import { TEST_IDS } from '@app/config/test-ids';

// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

// TODO : more tests
describe('New Proposal Page', () => {
  it('should navigate to propose page', () => {
    cy.visit('http://localhost:3000/governance/propose')
    cy.shouldTestId(TEST_IDS.announcement, 'exist')
  })
  
  it('should display the required voting power to propose', () => {
    cy.shouldTestId(TEST_IDS.governance.newProposalContainer, 'contain', '1000 voting power is required')
  })
})
