/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage and cart state before each test
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('addToCart', () => {
    it('should add a new item to the cart', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).not.toBeNull();

      // Click the button to add the item
      fireEvent.click(addButton);

      // The cart should now contain one item
      const cartDiv = screen.getByTestId('cart');
      expect(cartDiv.textContent).toBe('[{"id":"1","name":"Test Product","price":10,"quantity":1}]');
    });

    it('should increase quantity if item already exists', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).not.toBeNull();

      // Click the button twice to add the same item twice
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      // The cart should contain one item with quantity 2
      const cartDiv = screen.getByTestId('cart');
      expect(cartDiv.textContent).toBe('[{"id":"1","name":"Test Product","price":10,"quantity":2}]');
    });
  });

  describe('removeFromCart', () => {
    it('should remove an item from the cart by id', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      const removeButton = screen.getByRole('button', { name: /remove/i });
      expect(addButton).not.toBeNull();
      expect(removeButton).not.toBeNull();

      // Add an item
      fireEvent.click(addButton);
      // Remove the item
      fireEvent.click(removeButton);

      // The cart should be empty
      const cartDiv = screen.getByTestId('cart');
      expect(cartDiv.textContent).toBe('[]');
    });
  });

  describe('clearCart', () => {
    it('should clear the entire cart', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(addButton).not.toBeNull();
      expect(clearButton).not.toBeNull();

      // Add an item
      fireEvent.click(addButton);
      // Clear the cart
      fireEvent.click(clearButton);

      // The cart should be empty
      const cartDiv = screen.getByTestId('cart');
      expect(cartDiv.textContent).toBe('[]');
    });
  });

  describe('total and totalItems', () => {
    it('should calculate total price and total items correctly', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).not.toBeNull();

      // Add an item with price 10, quantity 1
      fireEvent.click(addButton);
      // Check total and totalItems
      const totalDiv = screen.getByTestId('total');
      const totalItemsDiv = screen.getByTestId('totalItems');
      expect(totalDiv.textContent).toBe('10');
      expect(totalItemsDiv.textContent).toBe('1');

      // Add another item (same item again) to have quantity 2
      fireEvent.click(addButton);
      // Now total should be 20, totalItems 2
      expect(totalDiv.textContent).toBe('20');
      expect(totalItemsDiv.textContent).toBe('2');
    });
  });
});

// Helper component to consume the context
function TestComponent() {
  const { cart, addToCart, removeFromCart, clearCart, total, totalItems } = useCart();
  return (
    <div>
      <div data-testid="cart">{JSON.stringify(cart)}</div>
      <div data-testid="addToCart">
        <button
          onClick={() =>
            addToCart({
              id: '1',
              name: 'Test Product',
              price: 10,
              quantity: 1,
            })
          }
        >
          Add
        </button>
      </div>
      <div data-testid="removeFromCart">
        <button onClick={() => removeFromCart('1')}>Remove</button>
      </div>
      <div data-testid="clearCart">
        <button onClick={clearCart}>Clear</button>
      </div>
      <div data-testid="total">{total}</div>
      <div data-testid="totalItems">{totalItems}</div>
    </div>
  );
}