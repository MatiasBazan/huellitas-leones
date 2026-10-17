import { z } from 'zod';
import { LIMITS } from '../constants.js';
import { Role, UserStatus } from '../enums.js';

export const emailSchema = z.email().trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(LIMITS.PASSWORD_MIN, `Mínimo ${LIMITS.PASSWORD_MIN} caracteres`)
  .max(LIMITS.PASSWORD_MAX);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(2).max(LIMITS.NAME_MAX),
  citySlug: z.string().min(1).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
  citySlug: z.string().min(1).optional(),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** segundos hasta que vence el access token */
  expiresIn: number;
};

export type JwtPayload = {
  sub: string;
  role: Role;
  cityId: string;
};

export type MeResponse = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  whatsapp: string | null;
  role: Role;
  status: UserStatus;
  notifyLostPets: boolean;
  city: { id: string; slug: string; name: string };
  neighborhood: { id: string; name: string } | null;
  /** true cuando falta completar datos mínimos (barrio) */
  profileIncomplete: boolean;
  createdAt: string;
};

export type AuthResponse = AuthTokens & { user: MeResponse };
