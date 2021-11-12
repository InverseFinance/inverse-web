/* eslint-disable */
import { TEST_IDS } from '@inverse/config/test-ids';
import { AnchorOperations } from '@inverse/types';

// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

const testTable = (table: string, minimumRequiredSymbols: string[]) => {
  minimumRequiredSymbols.forEach(symbol => {
    cy.getByFirstTestId(table)
      .findByTestId(`${TEST_IDS.anchor.tableItem}-${symbol}`)
      .should('exist')
  })
}

const describeModalOpen = (table: string, operation: AnchorOperations) => {
  describe(`Anchor ${operation} Modal`, () => {
    it(`should open ${operation} modal on table-item click`, () => {
      cy.getByFirstTestId(table)
        .findByTestId(`${TEST_IDS.anchor.tableItem}-DOLA`)
        .click()

      const modalTestId = `${TEST_IDS.anchor.modal}-${operation}`
      cy.shouldTestId(modalTestId, 'exist');

      cy.getByFirstTestId(modalTestId)
        .findByTestId(TEST_IDS.anchor.modalHeader)
        .contains(/dola/i);

      cy.getByFirstTestId(modalTestId)
        .findByTestId(TEST_IDS.anchor.modalFooter)
        .contains(new RegExp(`approve|${operation}`, 'i'));

      cy.get('body').click(0, 0);
    })
  })
}


// TODO : more tests
describe('Anchor Page', () => {
  it('should navigate to anchor', () => {
    cy.visit('http://localhost:3000/anchor')
    cy.shouldTestId(TEST_IDS.announcement, 'exist')
    cy.shouldTestId(TEST_IDS.connectBtn, 'exist')
    cy.shouldTestId(TEST_IDS.anchor.claim, 'exist')
    cy.shouldTestId(TEST_IDS.anchor.buyDola, 'exist')
  })

  it('should "learn more" btn https://docs.inverse.finance/anchor-and-dola-overview', () => {
    cy.getByFirstTestId(TEST_IDS.anchor.learnMore)
      .find('a')
      .should('have.attr', 'href', 'https://docs.inverse.finance/anchor-and-dola-overview')
  })

  it('should have "buy dola" btn lead to https://crv.to', () => {
    cy.getByFirstTestId(TEST_IDS.anchor.buyDola)
      .find('a')
      .should('have.attr', 'href', 'https://crv.to')
  })

  it('should have at least DOLA, INV, ETH & WBTC in supply markets', () => {
    testTable(TEST_IDS.anchor.supplyTable, ['DOLA', 'INV', 'ETH', 'WBTC'])
  })

  it('should have at least DOLA, ETH & WBTC in borrow markets', () => {
    testTable(TEST_IDS.anchor.borrowTable, ['DOLA', 'ETH', 'WBTC'])
  })

  describeModalOpen(TEST_IDS.anchor.supplyTable, AnchorOperations.supply)
  describeModalOpen(TEST_IDS.anchor.borrowTable, AnchorOperations.borrow)
})