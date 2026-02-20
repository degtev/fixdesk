import React, { useEffect, useRef, useState } from 'react';
import './Dropdown.css';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  items: DropdownItem[];
  anchorElement?: HTMLElement | null;
}

interface Position {
  top: number;
  right: number | string;
  left: number | string;
}

export const Dropdown: React.FC<DropdownProps> = ({ isOpen, onClose, items, anchorElement }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, right: 0, left: 'auto' });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [horizontalPlacement, setHorizontalPlacement] = useState<'left' | 'right'>('right');

  useEffect(() => {
    if (isOpen && anchorElement && dropdownRef.current) {
      const anchorRect = anchorElement.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const dropdownWidth = dropdownRef.current.offsetWidth;

      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      let newPlacement: 'top' | 'bottom' = 'bottom';
      let topPosition = anchorRect.bottom + 8;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        newPlacement = 'top';
        topPosition = anchorRect.top - dropdownHeight - 8;
      }

      let newHorizontalPlacement: 'left' | 'right' = 'right';
      let rightPosition: number | string = window.innerWidth - anchorRect.right;
      let leftPosition: number | string = 'auto';

      if (dropdownWidth > anchorRect.left) {
        newHorizontalPlacement = 'right';
        rightPosition = window.innerWidth - anchorRect.right;
        leftPosition = 'auto';
      } else {
        newHorizontalPlacement = 'left';
        rightPosition = 'auto';
        leftPosition = anchorRect.left - dropdownWidth;
      }

      setPlacement(newPlacement);
      setHorizontalPlacement(newHorizontalPlacement);
      setPosition({
        top: topPosition,
        right: rightPosition,
        left: leftPosition,
      });
    }
  }, [isOpen, anchorElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorElement]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`dropdown dropdown-${placement} dropdown-${horizontalPlacement}`}
      style={{
        top: `${position.top}px`,
        right: typeof position.right === 'number' ? `${position.right}px` : position.right,
        left: typeof position.left === 'number' ? `${position.left}px` : position.left,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="dropdown-item"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
          <span className="dropdown-item-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

