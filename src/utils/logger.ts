/**
 * Debug logging utility for development
 * Enable with: localStorage.setItem('ignite_debug', 'true')
 * All logs are stripped from production builds via vite-plugin-remove-console
 */

type LogCategory = 'API' | 'AUTH' | 'SYNC' | 'STORAGE';

const COLORS: Record<LogCategory, string> = {
  API: '#00bcd4',      // cyan
  AUTH: '#4caf50',     // green
  SYNC: '#ff9800',     // orange
  STORAGE: '#9c27b0',  // purple
};

function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem('ignite_debug') === 'true';
  } catch {
    return false;
  }
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

function log(category: LogCategory, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return;

  const timestamp = formatTimestamp();
  const color = COLORS[category];

  console.log(
    `%c[${timestamp}] [${category}] ${message}`,
    `color: ${color}; font-weight: bold`,
    data !== undefined ? data : ''
  );
}

export const logger = {
  api(operation: string, data?: unknown): void {
    log('API', operation, data);
  },

  auth(event: string, data?: unknown): void {
    log('AUTH', event, data);
  },

  sync(event: string, data?: unknown): void {
    log('SYNC', event, data);
  },

  storage(event: string, data?: unknown): void {
    log('STORAGE', event, data);
  },
};
