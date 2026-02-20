/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_TELEGRAM_BOT_USERNAME: string;
  readonly VITE_TELEGRAM_BOT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

