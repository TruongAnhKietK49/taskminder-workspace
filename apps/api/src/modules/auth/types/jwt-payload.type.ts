export type AccessTokenPayload = {
  sub: string;
  email: string;
  tokenType: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  tokenType: 'refresh';
};
