// Test Authentication Components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../src/shared/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock auth API
vi.mock('../src/shared/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authApi } from '../src/shared/api/auth';

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial state with no user', () => {
    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return null;
    };

    renderWithAuth(<TestComponent />);

    expect(authValue.user).toBeNull();
    expect(authValue.isAuthenticated).toBe(false);
    expect(authValue.loading).toBe(false);
  });

  it('should load user from localStorage on mount', () => {
    const mockUser = { id: 1, email: 'test@example.com', full_name: 'Test User' };
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return null;
    };

    renderWithAuth(<TestComponent />);

    expect(authValue.user).toEqual(mockUser);
    expect(authValue.isAuthenticated).toBe(true);
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      access_token: 'new-token',
      token_type: 'bearer',
      user: { id: 1, email: 'test@example.com', full_name: 'Test User' },
    };

    authApi.login.mockResolvedValueOnce(mockResponse);

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return (
        <button onClick={() => authValue.login('test@example.com', 'password')}>
          Login
        </button>
      );
    };

    renderWithAuth(<TestComponent />);

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(authValue.user).toEqual(mockResponse.user);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
  });

  it('should handle failed login', async () => {
    const mockError = { response: { data: { detail: 'Incorrect email or password' } } };
    authApi.login.mockRejectedValueOnce(mockError);

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return (
        <button onClick={() => authValue.login('wrong@example.com', 'wrongpass')}>
          Login
        </button>
      );
    };

    renderWithAuth(<TestComponent />);

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authValue.error).toContain('Incorrect email or password');
    });

    expect(authValue.isAuthenticated).toBe(false);
  });

  it('should handle successful registration', async () => {
    const mockUserData = {
      full_name: 'New User',
      email: 'new@example.com',
      phone: '+994501234567',
      password: 'password123',
    };

    authApi.register.mockResolvedValueOnce(mockUserData);

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return (
        <button onClick={() => authValue.register(mockUserData)}>
          Register
        </button>
      );
    };

    renderWithAuth(<TestComponent />);

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(mockUserData);
    });
  });

  it('should handle logout', async () => {
    // Set initial state
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return null;
    };

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(authValue.isAuthenticated).toBe(true);
    });

    // Now logout
    authApi.logout.mockImplementationOnce(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    });

    authValue.logout();

    expect(authValue.user).toBeNull();
    expect(authValue.isAuthenticated).toBe(false);
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', 'invalid-json{{{');

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return null;
    };

    renderWithAuth(<TestComponent />);

    // Should handle gracefully with no user
    expect(authValue.user).toBeNull();
    expect(authValue.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should refresh user profile', async () => {
    const mockProfile = { id: 1, email: 'updated@example.com', full_name: 'Updated User' };
    authApi.getProfile.mockResolvedValueOnce(mockProfile);

    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'old@example.com' }));

    let authValue;
    const TestComponent = () => {
      authValue = useAuth();
      return (
        <button onClick={() => authValue.refreshProfile()}>
          Refresh
        </button>
      );
    };

    renderWithAuth(<TestComponent />);

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(authApi.getProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(authValue.user).toEqual(mockProfile);
    });
  });
});
