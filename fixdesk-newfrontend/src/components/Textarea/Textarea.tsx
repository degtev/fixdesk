import React from 'react';
import './Textarea.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`textarea-wrapper ${className}`}>
      {label && <label className="textarea-label">{label}</label>}
      <textarea 
        className={`textarea ${error ? 'textarea-error' : ''}`}
        {...props}
      />
      {error && <span className="textarea-error-text">{error}</span>}
    </div>
  );
};