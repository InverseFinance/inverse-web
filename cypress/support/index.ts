// load type definitions that come with Cypress module
/// <reference types="cypress" />

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

declare namespace Cypress {
  interface Chainable {
    getByTestId(testId: string): Chainable<Element>
    shouldTestId(testId: string, should: string, shouldValue?: any): Chainable<Element>
    getByFirstTestId(testId: string): Chainable<Element>
    findByTestId(testId: string): Chainable<Element>
    findByFirstTestId(testId: string): Chainable<Element>
  }
}

Cypress.Commands.add('getByTestId', (testId) => cy.get(`[data-testid="${testId}"]`))
Cypress.Commands.add('shouldTestId', (testId, should, shouldValue) => cy.getByTestId(testId).should(should, shouldValue))
Cypress.Commands.add('getByFirstTestId', (testId) => cy.getByTestId(testId).first())
Cypress.Commands.add('findByTestId', { prevSubject: true }, (subject, testId) => subject.find(`[data-testid="${testId}"]`))