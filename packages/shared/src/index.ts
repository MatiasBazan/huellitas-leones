export * from './enums.js';
export * from './constants.js';
export * from './schemas/auth.js';
export * from './schemas/users.js';
export * from './schemas/media.js';
export * from './schemas/pets.js';
export * from './pets.js';

export type ApiError = {
  statusCode: number;
  message: string;
  issues?: { path: string; message: string }[];
};
