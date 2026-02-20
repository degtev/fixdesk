import React, { useEffect, useState } from 'react';

interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error';
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ id, message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div className={`notification notification--${type} ${isVisible ? 'notification--visible' : 'notification--hidden'}`}>
      <div className="notification__content">
        <span className="notification__message">{message}</span>
        <button className="notification__close" onClick={handleClose} aria-label="Закрыть уведомление">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};