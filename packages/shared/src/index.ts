export * from './enums.js';
export * from './constants.js';
export * from './schemas/auth.js';
export * from './schemas/users.js';

export type ApiError = {
  statusCode: number;
  message: string;
  issues?: { path: string; message: string }[];
};
