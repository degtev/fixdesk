import React, { useEffect } from 'react';
import { authUtils } from '../../utils/auth';

interface TelegramAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const TelegramAuth: React.FC<TelegramAuthProps> = ({
  onSuccess,
  onError,
  onClose
}) => {
  useEffect(() => {
    const botId = import.meta.env.VITE_TELEGRAM_BOT_ID || '7577253175';
    const origin = encodeURIComponent(window.location.origin);
    const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&request_access=write`;

    const width = 550;
    const height = 470;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      telegramAuthUrl,
      'telegram-auth',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!popup) {
      onError?.('Пожалуйста, разрешите всплывающие окна для этого сайта');
      onClose?.();
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== 'https://oauth.telegram.org') {
        return;
      }

      console.log('Telegram message received:', event.data, 'Type:', typeof event.data);

      let telegramData: any = null;

      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          console.log('Parsed JSON data:', parsed);
          if (parsed.event === 'auth_result' && parsed.result) {
            telegramData = parsed.result;
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          return;
        }
      }
      else if (typeof event.data === 'object' && event.data.id && event.data.hash) {
        const { origin, ...dataWithoutOrigin } = event.data;
        telegramData = dataWithoutOrigin;
      }

      if (telegramData && telegramData.id && telegramData.hash) {
        try {
          const token = authUtils.getToken();

          let response;
          if (token) {
            response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/oauth/telegram/link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ telegramData, token }),
            });
          } else {
            response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/oauth/telegram/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(telegramData),
            });
          }

          const data = await response.json();

          if (data.success) {
            if (popup && !popup.closed) {
              popup.close();
            }
            onSuccess?.();
          } else {
            const errorMsg = data.message || data.error || 'Неизвестная ошибка';
            console.error('Error details:', errorMsg);
            onError?.(errorMsg);
            if (popup && !popup.closed) {
              popup.close();
            }
          }
        } catch (error: any) {
          console.error('Telegram auth error:', error);
          console.error('Error details:', error.message, error.stack);
          const errorMsg = error.message || 'Ошибка соединения с сервером';
          onError?.(errorMsg);
          if (popup && !popup.closed) {
            popup.close();
          }
        }

        window.removeEventListener('message', handleMessage);
        if (checkPopupClosed) {
          clearInterval(checkPopupClosed);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        console.log('Popup closed by user');
        clearInterval(checkPopupClosed);
        window.removeEventListener('message', handleMessage);
        onClose?.();
      }
    }, 1000);

    const timeout = setTimeout(() => {
      if (popup && !popup.closed) {
        console.log('Closing popup due to timeout');
        popup.close();
      }
      clearInterval(checkPopupClosed);
      window.removeEventListener('message', handleMessage);
      onClose?.();
    }, 3000);

    return () => {
      if (popup && !popup.closed) {
        popup.close();
      }
      clearInterval(checkPopupClosed);
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [onSuccess, onError, onClose]);

  return null;
};