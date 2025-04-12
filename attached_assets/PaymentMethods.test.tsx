
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentMethods } from './PaymentMethods';

describe('PaymentMethods', () => {
  it('renders all payment options', () => {
    render(<PaymentMethods plan="pro" onComplete={jest.fn()} />);
    
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
    expect(screen.getByText('D17')).toBeInTheDocument();
    expect(screen.getByText('QPay')).toBeInTheDocument();
  });

  it('handles payment submission', async () => {
    const onComplete = jest.fn();
    render(<PaymentMethods plan="pro" onComplete={onComplete} />);
    
    fireEvent.click(screen.getByText('Pay Now'));
    expect(onComplete).toHaveBeenCalled();
  });
});
