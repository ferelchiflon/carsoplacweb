/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailure from './PaymentFailure';
import PaymentPending from './PaymentPending';

describe('Payment Pages Routing', () => {
  describe('PaymentSuccess page', () => {
    it('renders the success page when navigating to /payment/success', () => {
      render(
        <MemoryRouter initialEntries={['/payment/success']}>
          <Routes>
            <Route path='/payment/success' element={<PaymentSuccess />} />
            <Route path='/payment/failure' element={<PaymentFailure />} />
            <Route path='/payment/pending' element={<PaymentPending />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByTestId('payment-success-page')
      ).not.toBeNull();
    });
  });

  describe('PaymentFailure page', () => {
    it('renders the failure page when navigating to /payment/failure', () => {
      render(
        <MemoryRouter initialEntries={['/payment/failure']}>
          <Routes>
            <Route path='/payment/success' element={<PaymentSuccess />} />
            <Route path='/payment/failure' element={<PaymentFailure />} />
            <Route path='/payment/pending' element={<PaymentPending />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByTestId('payment-failure-page')
      ).not.toBeNull();
    });
  });

  describe('PaymentPending page', () => {
    it('renders the pending page when navigating to /payment/pending', () => {
      render(
        <MemoryRouter initialEntries={['/payment/pending']}>
          <Routes>
            <Route path='/payment/success' element={<PaymentSuccess />} />
            <Route path='/payment/failure' element={<PaymentFailure />} />
            <Route path='/payment/pending' element={<PaymentPending />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        screen.getByTestId('payment-pending-page')
      ).not.toBeNull();
    });
  });
});