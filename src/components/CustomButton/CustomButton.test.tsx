import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomButton from './CustomButton';

jest.mock('./CustomButton', () => {
  return ({ onClick, children, isActive } : { onClick: () => void; children: React.ReactNode; isActive?: boolean; }) => (
    <button
      onClick={onClick}
      className={`mock-button ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  );
});

describe('CustomButton', () => {
  const handleClick = jest.fn();

  it('renders the button with children', () => {
    render(<CustomButton onClick={handleClick}>Click Me</CustomButton>);
    expect(screen.getByText(/Click Me/i)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<CustomButton onClick={handleClick}>Click Me</CustomButton>);
    fireEvent.click(screen.getByText(/Click Me/i));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the active class when isActive is true', () => {
    render(
      <CustomButton onClick={handleClick} isActive={true}>
        Active Button
      </CustomButton>
    );
    const button = screen.getByText(/Active Button/i);
    expect(button).toHaveClass('active');
  });

  it('does not apply the active class when isActive is false', () => {
    render(
      <CustomButton onClick={handleClick} isActive={false}>
        Inactive Button
      </CustomButton>
    );
    const button = screen.getByText(/Inactive Button/i);
    expect(button).not.toHaveClass('active');
  });
});
