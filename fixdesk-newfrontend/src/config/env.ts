export const config = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  telegram: {
    botUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'fixdesk_bot',
    botId: import.meta.env.VITE_TELEGRAM_BOT_ID || '7577253175',
  },
};

