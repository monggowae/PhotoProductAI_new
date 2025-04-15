export const TIME_ZONE = 'Asia/Jakarta';

export const DATE_FORMAT_OPTIONS = {
  full: {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  withTime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  }
} as const;

export const TOKEN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const ITEMS_PER_PAGE = 10;

export const MIN_TOKEN_AMOUNT = 1;