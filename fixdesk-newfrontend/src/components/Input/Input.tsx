import React, { useState } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  className = '', 
  type,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <div className="input-icon">{icon}</div>}
        <input 
          className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''} ${isPasswordField ? 'input-with-password-toggle' : ''}`}
          type={inputType}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5.83333C12.3 5.83333 14.1667 7.7 14.1667 10C14.1667 10.5417 14.0584 11.05 13.8667 11.525L16.3 13.9583C17.5584 12.9083 18.55 11.55 19.1584 10C17.7167 6.34167 14.1584 3.75 9.99171 3.75C8.82504 3.75 7.70837 3.95833 6.67504 4.33333L8.47504 6.13333C8.95004 5.94167 9.45837 5.83333 10 5.83333ZM1.66671 3.55833L3.56671 5.45833L3.95004 5.84167C2.56671 6.91667 1.48337 8.35 0.833374 10C2.27504 13.6583 5.83337 16.25 10 16.25C11.2917 16.25 12.525 16 13.65 15.55L14 15.9L16.4417 18.3333L17.5 17.275L2.72504 2.5L1.66671 3.55833ZM6.27504 8.16667L7.56671 9.45833C7.52504 9.63333 7.50004 9.81667 7.50004 10C7.50004 11.3833 8.61671 12.5 10 12.5C10.1834 12.5 10.3667 12.475 10.5417 12.4333L11.8334 13.725C11.275 14 10.6584 14.1667 10 14.1667C7.70004 14.1667 5.83337 12.3 5.83337 10C5.83337 9.34167 6.00004 8.725 6.27504 8.16667ZM9.86671 7.51667L12.4917 10.1417L12.5084 10.0083C12.5084 8.625 11.3917 7.50833 10.0084 7.50833L9.86671 7.51667Z" fill="#B2B8CD"/>
              </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="13" viewBox="0 0 19 13" fill="none">
                <path d="M9.16667 0C5 0 1.44167 2.59167 0 6.25C1.44167 9.90833 5 12.5 9.16667 12.5C13.3333 12.5 16.8917 9.90833 18.3333 6.25C16.8917 2.59167 13.3333 0 9.16667 0ZM9.16667 10.4167C6.86667 10.4167 5 8.55 5 6.25C5 3.95 6.86667 2.08333 9.16667 2.08333C11.4667 2.08333 13.3333 3.95 13.3333 6.25C13.3333 8.55 11.4667 10.4167 9.16667 10.4167ZM9.16667 3.75C7.78333 3.75 6.66667 4.86667 6.66667 6.25C6.66667 7.63333 7.78333 8.75 9.16667 8.75C10.55 8.75 11.6667 7.63333 11.6667 6.25C11.6667 4.86667 10.55 3.75 9.16667 3.75Z" fill="white"/>
                </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

