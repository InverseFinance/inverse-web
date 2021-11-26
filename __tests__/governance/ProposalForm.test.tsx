/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProposalForm } from '@inverse/components/Governance/Propose/ProposalForm';
import { TEST_IDS } from '@inverse/config/test-ids';

describe('Proposal Form', () => {
  let proposalFormContainer: any

  it('renders proposal form', () => {
    render(<ProposalForm />)

    proposalFormContainer = screen.getByTestId(TEST_IDS.governance.newProposalFormContainer)

    expect(proposalFormContainer).toBeInTheDocument()
  })
})
