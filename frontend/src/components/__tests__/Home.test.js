import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';

// Mock Web3Context hook
jest.mock('../../contexts/Web3Context', () => ({
  useWeb3: () => ({
    account: null,
    isAdmin: false,
    loading: false,
    networkError: null
  })
}));

describe('Home Component', () => {
  test('renders connect wallet button when not connected', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    const connectButton = screen.getByText(/Connect Wallet/i);
    expect(connectButton).toBeInTheDocument();
  });
});