export type AuthenticatedUser = {
  id: string;
  name: string;
  mobile: string;
  email: string;
};

export type AuthenticatedSession = {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

export type SessionRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};
