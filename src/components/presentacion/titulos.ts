/**
 * Los títulos de las diapositivas de la presentación de clases. Viven aparte de
 * `diapositivas.tsx` (que es de cliente y trae las imágenes) para que la pestaña de
 * Soporte —un componente de servidor— pueda listar el contenido sin cargarlo todo.
 */
export const DIAPOSITIVAS = [
  { id: "portada", titulo: "Portada" },
  { id: "normas", titulo: "Normas" },
  { id: "horarios", titulo: "Horarios" },
  { id: "activa-tu-cuenta", titulo: "Activa tu cuenta" },
  { id: "actualizaciones", titulo: "Actualizaciones" },
  { id: "cierre", titulo: "Cierre" },
] as const;

export type IdDiapositiva = (typeof DIAPOSITIVAS)[number]["id"];
