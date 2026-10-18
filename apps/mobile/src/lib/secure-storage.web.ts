// Solo para previsualizar la app en el navegador durante el desarrollo (la web real es apps/web).
// sessionStorage: la sesión muere al cerrar la pestaña.
export const secureStorage = {
  get: async (key: string) => sessionStorage.getItem(key),
  set: async (key: string, value: string) => sessionStorage.setItem(key, value),
  remove: async (key: string) => sessionStorage.removeItem(key),
};
