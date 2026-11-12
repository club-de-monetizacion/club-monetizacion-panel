/**
 * La app de escritorio de Tareas («Tareas del Club», Mac y Windows). Diego, 11 nov 2026:
 * «no es una app diferente, es la misma solo que de escritorio; se inicia sesión con el
 * mismo usuario». La app carga esta web y le añade el botón flotante, el atajo y los avisos.
 *
 * Fuente única de la versión publicada y de sus descargas: la usan la página /escritorio
 * y /api/escritorio (la app pregunta ahí si hay versión nueva).
 * Para publicar una versión: subir `version` en el package.json de la app, construir,
 * subir los instaladores a tareas-escritorio.vercel.app/v<version>/ y cambiar esto.
 * El código de la app vive en «/Volumes/DISCO 4T/Claude/Tareas Escritorio (Club)».
 */
export const ESCRITORIO = {
  version: "1.0.0",
  fecha: "11 nov 2026",
  descargas: {
    macArm: {
      url: "https://tareas-escritorio.vercel.app/v1.0.0/Tareas-del-Club-mac-arm64.dmg",
      peso: "119 MB",
    },
    macIntel: {
      url: "https://tareas-escritorio.vercel.app/v1.0.0/Tareas-del-Club-mac-x64.dmg",
      peso: "125 MB",
    },
    windows: {
      url: "https://tareas-escritorio.vercel.app/v1.0.0/Tareas-del-Club-windows.exe",
      peso: "112 MB",
    },
  },
} as const;

/** Lo que la app añade a su nombre de navegador: así la web sabe que está dentro de ella. */
export const MARCA_ESCRITORIO = "TareasClubEscritorio/";
