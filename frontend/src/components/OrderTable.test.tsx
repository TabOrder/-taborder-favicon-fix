import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import OrderTable from './OrderTable';
import { Order } from '../types/order';

// Create a theme instance
const theme = createTheme();

// Wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock data for testing
const mockOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-001',
    customer: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    },
    spaza_id: '1',
    items: [
      {
        id: '1',
        product: {
          id: 'prod-1',
          name: 'Product 1', // ✅ Correct: 'name' is inside 'product'
        },
        quantity: 2,
        price: 10,
        total: 20,
      }
    ],
    total_amount: 21.98,
    status: 'pending',
    created_at: '2024-03-20T10:00:00Z',
    updated_at: '2024-03-20T10:00:00Z'
  },
  {
    id: '2',
    order_number: 'ORD-002',
    customer: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321'
    },
    spaza_id: '2',
    items: [
      {
        id: '2',
        product: {
          id: 'prod-2',
          name: 'Product 2'
        },
        quantity: 1,
        price: 15.99,
        total: 15.99
      }
    ],
    total_amount: 15.99,
    status: 'confirmed',
    created_at: '2024-03-20T11:00:00Z',
    updated_at: '2024-03-20T11:00:00Z'
  }
];

describe('OrderTable', () => {
  const defaultProps = {
    orders: mockOrders,
    totalOrders: 2,
    page: 0,
    rowsPerPage: 10,
    onPageChange: jest.fn(),
    onRowsPerPageChange: jest.fn(),
    onViewOrder: jest.fn(),
    onEditOrder: jest.fn(),
    onDeleteOrder: jest.fn(),
    onStatusChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  it('renders the table with correct headers', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    
    expect(screen.getByText('Order #')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Spaza Shop')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders orders with correct data', () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // spaza_id
    expect(screen.getAllByText(/1 items/)[0]).toBeInTheDocument();
    expect(screen.getByText(/R\s?21[,.]98/)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    const viewOrderButtons = screen.getAllByRole('button', { name: /view order/i });
    expect(viewOrderButtons.length).toBeGreaterThan(0);
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    expect(moreButtons.length).toBeGreaterThan(0);
  });

  it('handles empty orders list', () => {
    renderWithProviders(<OrderTable {...defaultProps} orders={[]} totalOrders={0} />);
    
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('calls onViewOrder when view button is clicked', async () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    const viewButtons = screen.getAllByRole('button', { name: /view order/i });
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });
    await waitFor(() => {
      expect(defaultProps.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
    });
  });

  it('opens status change menu and handles status change', async () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    await act(async () => {
      fireEvent.click(moreButtons[0]);
    });
    // Wait for menu to open and look for the "Mark as Delivered" menu item
    await waitFor(() => {
      const menuItem = screen.getByText(/mark as delivered/i);
      fireEvent.click(menuItem);
    });
    await waitFor(() => {
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(mockOrders[0], 'delivered');
    });
  });

  it('handles pagination changes', async () => {
    renderWithProviders(<OrderTable {...defaultProps} totalOrders={20} />);
    const nextPageButton = screen.getByLabelText('Go to next page');
    await act(async () => {
      fireEvent.click(nextPageButton);
    });
    await waitFor(() => {
      expect(defaultProps.onPageChange).toHaveBeenCalled();
    });
  });

  it('handles rows per page changes', async () => {
    renderWithProviders(<OrderTable {...defaultProps} />);
    const rowsPerPageSelect = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.mouseDown(rowsPerPageSelect);
    });
    const option = screen.getByText('25');
    await act(async () => {
      fireEvent.click(option);
    });
    await waitFor(() => {
      expect(defaultProps.onRowsPerPageChange).toHaveBeenCalledWith(25);
    });
  });
});