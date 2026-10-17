// Espejo de los enums de Prisma. Un test en apps/api verifica que no se desincronicen.

export const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = { ACTIVE: 'ACTIVE', BLOCKED: 'BLOCKED', DELETED: 'DELETED' } as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Species = { PERRO: 'PERRO', GATO: 'GATO', OTRO: 'OTRO' } as const;
export type Species = (typeof Species)[keyof typeof Species];

export const Sex = { MACHO: 'MACHO', HEMBRA: 'HEMBRA', DESCONOCIDO: 'DESCONOCIDO' } as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

export const PetSize = { CHICO: 'CHICO', MEDIANO: 'MEDIANO', GRANDE: 'GRANDE' } as const;
export type PetSize = (typeof PetSize)[keyof typeof PetSize];

export const PetStatus = { EN_CASA: 'EN_CASA', PERDIDA: 'PERDIDA' } as const;
export type PetStatus = (typeof PetStatus)[keyof typeof PetStatus];

export const PostType = { PERDIDA: 'PERDIDA', ENCONTRADA: 'ENCONTRADA', ADOPCION: 'ADOPCION' } as const;
export type PostType = (typeof PostType)[keyof typeof PostType];

export const PostStatus = { ACTIVA: 'ACTIVA', RESUELTA: 'RESUELTA', OCULTA: 'OCULTA' } as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const Resolution = { REENCONTRADA: 'REENCONTRADA', ADOPTADA: 'ADOPTADA', OTRO: 'OTRO' } as const;
export type Resolution = (typeof Resolution)[keyof typeof Resolution];

export const MediaStatus = { PENDING: 'PENDING', READY: 'READY' } as const;
export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus];

export const Platform = { ANDROID: 'ANDROID', IOS: 'IOS', WEB: 'WEB' } as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ReportReason = {
  SPAM: 'SPAM',
  FALSA: 'FALSA',
  VENTA: 'VENTA',
  MALTRATO: 'MALTRATO',
  INAPROPIADA: 'INAPROPIADA',
  OTRO: 'OTRO',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  PENDIENTE: 'PENDIENTE',
  RESUELTO: 'RESUELTO',
  DESCARTADO: 'DESCARTADO',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ModerationActionType = {
  HIDE_POST: 'HIDE_POST',
  UNHIDE_POST: 'UNHIDE_POST',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',
  DISMISS_REPORT: 'DISMISS_REPORT',
} as const;
export type ModerationActionType = (typeof ModerationActionType)[keyof typeof ModerationActionType];

export const ENUMS = {
  Role,
  UserStatus,
  Species,
  Sex,
  PetSize,
  PetStatus,
  PostType,
  PostStatus,
  Resolution,
  MediaStatus,
  Platform,
  ReportReason,
  ReportStatus,
  ModerationActionType,
} as const;
