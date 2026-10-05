/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '../../context/CartContext';
import ProductCard from './ProductCard';

// Mock react-router-dom's useOutletContext to avoid null context
vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn().mockReturnValue({ setOpenCart: vi.fn() }),
}));

describe('ProductCard', () => {
  const baseProps = {
    id: '1',
    img: 'test.jpg',
    name: 'Test Product',
    provider: 'Test Provider',
    category: 'Test Category',
    price: '100,00', // 100 pesos
  };

  beforeEach(() => {
    // We don't have any setup for now
  });

  afterEach(() => {
    // We don't have any cleanup for now
  });

  it('renders the product name and price', () => {
    render(
      <CartProvider>
        <ProductCard {...baseProps} />
      </CartProvider>
    );

    expect(screen.getByText('Test Product')).not.toBeNull();
    expect(screen.getByText(/\$\s*100/)).not.toBeNull();
  });

  it('shows discount badge when oldPrice is greater than price', () => {
    const props = {
      ...baseProps,
      oldPrice: '150,00', // 150 pesos
      price: '100,00',    // 100 pesos
      // discount should be ((150-100)/150)*100 = 33.33 -> rounded to 33
    };

    render(
      <CartProvider>
        <ProductCard {...props} />
      </CartProvider>
    );

    // The badge should show "-33%"
    const badge = screen.getByText('-33%');
    expect(badge).not.toBeNull();
  });

  it('does not show discount badge when oldPrice is less than or equal to price', () => {
    // Case 1: oldPrice equals price
    render(
      <CartProvider>
        <ProductCard {...baseProps} oldPrice='100,00' />
      </CartProvider>
    );
    expect(screen.queryByText(/-%/)).toBeNull();

    // Case 2: oldPrice less than price
    render(
      <CartProvider>
        <ProductCard {...baseProps} oldPrice='80,00' />
      </CartProvider>
    );
    expect(screen.queryByText(/-%/)).toBeNull();
  });

  it('does not show discount badge when price is 0 or invalid', () => {
    // price is 0
    render(
      <CartProvider>
        <ProductCard {...baseProps} price='0,00' oldPrice='100,00' />
      </CartProvider>
    );
    expect(screen.queryByText(/-%/)).toBeNull();

    // price is invalid string
    render(
      <CartProvider>
        <ProductCard {...baseProps} price='invalid' oldPrice='100,00' />
      </CartProvider>
    );
    expect(screen.queryByText(/-%/)).toBeNull();
  });
});