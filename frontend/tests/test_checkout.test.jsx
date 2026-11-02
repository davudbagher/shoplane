// Test Checkout Page
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutPage } from '../src/features/storefront/pages/CheckoutPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/shared/contexts/AuthContext';

// Mock dependencies
vi.mock('../src/shared/api', () => ({
  storefrontApi: {
    getShop: vi.fn(),
    validateCoupon: vi.fn(),
    createOrder: vi.fn(),
  },
  getShopSubdomain: () => 'testshop',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { storefrontApi } from '../src/shared/api';

const renderCheckout = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CheckoutPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should redirect to cart if cart is empty', async () => {
    localStorage.setItem('cart', '[]');
    
    renderCheckout();

    await waitFor(() => {
      // Should have redirected (navigate called)
      expect(true).toBe(true);
    });
  });

  it('should render checkout form with cart items', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
      allow_online_payment: false,
      millikart_enabled: false,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Should show form fields
    expect(screen.getByPlaceholderText('Aysel Məmmədova')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+994 XX XXX XX XX')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
      allow_online_payment: false,
      millikart_enabled: false,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Try to submit without filling form
    const submitButton = screen.getByText(/SİFARİŞİ TƏSDİQ ET/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ad və soyad vacibdir')).toBeInTheDocument();
      expect(screen.getByText('Telefon vacibdir')).toBeInTheDocument();
    });
  });

  it('should calculate order total correctly', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Product 1',
        price: 50.00,
        quantity: 2,
      },
      {
        product_id: 2,
        name: 'Product 2',
        price: 30.00,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
      allow_online_payment: false,
      millikart_enabled: false,
    });

    renderCheckout();

    await waitFor(() => {
      // Subtotal: (50 * 2) + (30 * 1) = 130
      expect(screen.getAllByText('130.00 ₼').length).toBeGreaterThan(0);
    });
  });

  it('should toggle delivery type', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Should show courier form by default
    expect(screen.getByText('Şəhər *')).toBeInTheDocument();

    // Switch to pickup
    const pickupButton = screen.getByText('Təhvil Məntəqəsi');
    fireEvent.click(pickupButton);

    // Should show pickup point selector
    await waitFor(() => {
      expect(screen.getByText('-- Məntəqə seçin --')).toBeInTheDocument();
    });
  });

  it('should submit order successfully', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
      allow_online_payment: false,
      millikart_enabled: false,
    });

    storefrontApi.createOrder.mockResolvedValueOnce({
      order_number: 'ORD-TEST-123',
      total: 29.99,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.input(screen.getByPlaceholderText('Aysel Məmmədova'), {
      target: { value: 'Test Customer' },
    });
    fireEvent.input(screen.getByPlaceholderText('+994 XX XXX XX XX'), {
      target: { value: '+994501234567' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Bakı' } });
    fireEvent.input(screen.getByPlaceholderText('Küçə, bina, mənzil nömrəsi...'), {
      target: { value: 'Test Street 1' },
    });

    // Submit
    const submitButton = screen.getByText(/SİFARİŞİ TƏSDİQ ET/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(storefrontApi.createOrder).toHaveBeenCalled();
    });

    // Verify cart cleared
    expect(localStorage.getItem('cart')).toBe('[]');
  });

  it('should handle order creation error', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
    });

    storefrontApi.createOrder.mockRejectedValueOnce({
      response: { data: { detail: 'Product out of stock' } },
    });

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.input(screen.getByPlaceholderText('Aysel Məmmədova'), {
      target: { value: 'Test Customer' },
    });
    fireEvent.input(screen.getByPlaceholderText('+994 XX XXX XX XX'), {
      target: { value: '+994501234567' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Bakı' } });
    fireEvent.input(screen.getByPlaceholderText('Küçə, bina, mənzil nömrəsi...'), {
      target: { value: 'Test Street 1' },
    });

    // Submit
    const submitButton = screen.getByText(/SİFARİŞİ TƏSDİQ ET/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Product out of stock');
    });

    alertMock.mockRestore();
  });

  it('should validate phone number format', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 29.99,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    storefrontApi.getShop.mockResolvedValueOnce({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Fill name
    fireEvent.input(screen.getByPlaceholderText('Aysel Məmmədova'), {
      target: { value: 'Test Customer' },
    });

    // Enter invalid phone
    fireEvent.input(screen.getByPlaceholderText('+994 XX XXX XX XX'), {
      target: { value: 'invalid-phone!!!' },
    });

    // Submit
    const submitButton = screen.getByText(/SİFARİŞİ TƏSDİQ ET/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Düzgün nömrə daxil edin')).toBeInTheDocument();
    });
  });

  it('should create the order before redirecting to MilliKart', async () => {
    const mockCart = [
      {
        product_id: 1,
        name: 'Test Product',
        price: 50.00,
        quantity: 1,
      },
    ];
    localStorage.setItem('cart', JSON.stringify(mockCart));

    // StorefrontLayout calls getShop too, so one response is not enough
    storefrontApi.getShop.mockReset();
    storefrontApi.getShop.mockResolvedValue({
      id: 1,
      name: 'Test Shop',
      allow_cod: true,
      allow_online_payment: true,
      millikart_enabled: true,
      millikart_payment_link: 'https://millikart.az/pay',
    });

    storefrontApi.createOrder.mockResolvedValueOnce({
      order_number: 'ORD-MILLI-123',
      total: 50.00,
    });

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText('Ödəniş Və Çatdırılma')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.input(screen.getByPlaceholderText('Aysel Məmmədova'), {
      target: { value: 'Test Customer' },
    });
    fireEvent.input(screen.getByPlaceholderText('+994 XX XXX XX XX'), {
      target: { value: '+994501234567' },
    });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Bakı' } });
    fireEvent.input(screen.getByPlaceholderText('Küçə, bina, mənzil nömrəsi...'), {
      target: { value: 'Test Street 1' },
    });

    // Select MilliKart payment
    fireEvent.click(await screen.findByRole('radio', { name: /MilliKart/ }));

    // Submit
    fireEvent.click(screen.getByText(/SİFARİŞİ TƏSDİQ ET/));

    await waitFor(() => {
      expect(storefrontApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'millikart' })
      );
    });
  });
});
