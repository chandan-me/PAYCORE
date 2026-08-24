import React from 'react';

interface MoneyFormatProps {
  amount: number; // Integer minor units (e.g., 149900 = ₹1,499.00)
  currency?: string;
  className?: string;
}

export const MoneyFormat: React.FC<MoneyFormatProps> = ({ amount, currency = 'INR', className = '' }) => {
  const majorValue = (amount || 0) / 100;
  
  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbolMap[currency.toUpperCase()] || currency;
  const formattedNumber = majorValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`font-mono ${className}`}>
      {symbol}{formattedNumber}
    </span>
  );
};
