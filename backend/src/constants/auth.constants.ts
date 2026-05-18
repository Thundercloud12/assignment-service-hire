export const USER_ROLES = {
  ADMIN: 'admin',
  SALES_USER: 'sales_user',
} as const;

export const AUTH_HEADER_PREFIX = 'Bearer';

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];