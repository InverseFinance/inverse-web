/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render } from '@testing-library/react'
import ScannerLink from '@inverse/components/common/ScannerLink';

describe('ScannerLink', () => {
  it('renders correct address link', () => {
    const { container  } = render(<ScannerLink type="address" value="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" />)
    const a = container.querySelector('a')
    expect(a).exist
    expect(a?.getAttribute('href')).toBe('https://etherscan.io/address/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')
  })

  it('renders correct tx link', () => {
    const { container  } = render(<ScannerLink type="tx" value="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" />)
    const a = container.querySelector('a')
    expect(a).exist
    expect(a?.getAttribute('href')).toBe('https://etherscan.io/tx/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')
  })

  it('renders correct address link with label', () => {
    const { container  } = render(<ScannerLink type="address" value="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" label="Link Label" />)
    const a = container.querySelector('a')
    expect(a).exist
    expect(a?.getAttribute('href')).toBe('https://etherscan.io/address/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')
    expect(a?.innerHTML).toBe('Link Label')
  })

  it('renders correct address link with shortened address', () => {
    const { container  } = render(<ScannerLink type="address" value="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" shorten={true} />)
    const a = container.querySelector('a')
    expect(a).exist
    expect(a?.getAttribute('href')).toBe('https://etherscan.io/address/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')
    expect(a?.innerHTML).toBe('0xAb58...eC9B')
  })
})
