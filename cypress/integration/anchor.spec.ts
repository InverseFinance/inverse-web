/* eslint-disable */
import { TEST_IDS } from '@inverse/config/test-ids';
import { AnchorOperations } from '@inverse/types';

// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

// TODO : more tests

const sortableColExamples = {
  [AnchorOperations.supply]: 'balance',
  [AnchorOperations.withdraw]: 'balance',
  [AnchorOperations.borrow]: 'borrowApy',
  [AnchorOperations.repay]: 'borrowApy',
}

const describeTable = (table: string, minimumRequiredSymbols: string[], type: AnchorOperations) => {
  describe(`Anchor ${table}`, () => {
    it(`should have at least ${minimumRequiredSymbols.join(', ')}`, () => {
      minimumRequiredSymbols.forEach(symbol => {
        cy.getByFirstTestId(table)
          .findByTestId(`${TEST_IDS.anchor.tableItem}-${symbol}`)
          .should('exist')
      })
    })

    // TODO : unit tests for table component
    it(`should be able to sort`, () => {
      cy.getByFirstTestId(table)
        .should('have.attr', 'data-sort-by', 'symbol')
        .should('have.attr', 'data-sort-dir', 'asc')

      cy.getByFirstTestId(table)
        .findByTestId(`${TEST_IDS.colHeaderBox}-symbol`)
        .click()

      cy.getByFirstTestId(table)
        .should('have.attr', 'data-sort-by', 'symbol')
        .should('have.attr', 'data-sort-dir', 'desc')

      cy.getByFirstTestId(table)
        .findByTestId(`${TEST_IDS.colHeaderBox}-symbol`)
        .click()

      cy.getByFirstTestId(table)
        .should('have.attr', 'data-sort-by', 'symbol')
        .should('have.attr', 'data-sort-dir', 'asc')

      const otherSortableCol = sortableColExamples[type];

      cy.getByFirstTestId(table)
        .findByTestId(`${TEST_IDS.colHeaderBox}-${otherSortableCol}`)
        .click()

      cy.getByFirstTestId(table)
        .should('have.attr', 'data-sort-by', otherSortableCol)
        .should('have.attr', 'data-sort-dir', 'asc')

      cy.getByFirstTestId(table)
        .findByTestId(`${TEST_IDS.colHeaderBox}-${otherSortableCol}`)
        .click()

      cy.getByFirstTestId(table)
        .should('have.attr', 'data-sort-by', otherSortableCol)
        .should('have.attr', 'data-sort-dir', 'desc')
    })
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
      .should('have.attr', 'href', 'https://docs.inverse.finance/anchor-and-dola-overview')
  })

  it('should have "buy dola" btn lead to https://crv.to', () => {
    cy.getByFirstTestId(TEST_IDS.anchor.buyDola)
      .should('have.attr', 'href', 'https://crv.to')
  })

  describeTable(TEST_IDS.anchor.supplyTable, ['DOLA', 'INV', 'ETH', 'WBTC'], AnchorOperations.supply)
  describeTable(TEST_IDS.anchor.borrowTable, ['DOLA', 'ETH', 'WBTC'], AnchorOperations.borrow)

  describeModalOpen(TEST_IDS.anchor.supplyTable, AnchorOperations.supply)
  describeModalOpen(TEST_IDS.anchor.borrowTable, AnchorOperations.borrow)
})