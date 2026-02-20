import React, { useState, useRef, useEffect } from 'react';
import './index.css';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
 const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const showHandler = () => setShowTooltip(true);
    const hideHandler = () => setShowTooltip(false);

    wrapper.addEventListener('mouseenter', showHandler);
    wrapper.addEventListener('mouseleave', hideHandler);

    return () => {
      wrapper.removeEventListener('mouseenter', showHandler);
      wrapper.removeEventListener('mouseleave', hideHandler);
    };
  }, []);

  return (
    <div className="tooltip-wrapper" ref={wrapperRef}>
      {children}
      <div className={`tooltip tooltip-${position} ${showTooltip ? 'show' : ''}`}>
        {content}
      </div>
    </div>
  );
};