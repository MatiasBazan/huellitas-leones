export type StoredObject = { sizeBytes: number; contentType: string | null };

export type UploadTarget = { url: string; headers: Record<string, string> };

/** Abstracción del bucket. Se elige la implementación con STORAGE_DRIVER. */
export abstract class StorageService {
  /** URL firmada para un PUT directo desde el cliente, atada a tipo y tamaño */
  abstract createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<UploadTarget>;
  /** null si el objeto no existe */
  abstract stat(key: string): Promise<StoredObject | null>;
  abstract delete(keys: string[]): Promise<void>;
  abstract publicUrl(key: string): string;
}
