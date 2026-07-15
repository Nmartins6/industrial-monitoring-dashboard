import { render, screen } from '@testing-library/react';

import { describe, expect, it } from '@jest/globals';

import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  it('renders the light and dark brand assets accessibly', () => {
    render(<BrandLogo />);

    const brand = screen.getByRole('img', {
      name: 'STW',
    });

    expect(brand).toBeInTheDocument();

    expect(
      brand.querySelector('img[src="/brand/logo-on-light.svg"]'),
    ).toBeInTheDocument();

    expect(
      brand.querySelector('img[src="/brand/logo-on-dark.svg"]'),
    ).toBeInTheDocument();
  });
});
