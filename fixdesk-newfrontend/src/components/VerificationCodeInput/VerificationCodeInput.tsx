import React, { ChangeEvent } from 'react';
import './VerificationCodeInput.css';

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const digitsOnly = newValue.replace(/\D/g, '');
    const truncated = digitsOnly.slice(0, length);
    onChange(truncated);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/\D/g, '');
    const truncated = digitsOnly.slice(0, length);
    onChange(truncated);
  };

  return (
    <div className="verification-code-input-single">
      <input
        type="text"
        inputMode="numeric"
        maxLength={length}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        className="verification-code-single"
        placeholder="000000"
        autoComplete="off"
      />
    </div>
  );
};
