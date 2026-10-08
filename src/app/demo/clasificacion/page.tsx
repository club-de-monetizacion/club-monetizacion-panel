import { filasDeLaTabla, type Orden } from "@/lib/desafios-data";
import { ClasificacionVista, PESTANAS } from "@/components/desafios/vistas/clasificacion";

export const metadata = { title: "Clasificación — Demo" };

export default async function DemoClasificacion({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const orden: Orden = PESTANAS.some((p) => p.id === t) ? (t as Orden) : "puntos";
  // `soloDemo`: solo los perfiles inventados, nunca uno real.
  const todas = await filasDeLaTabla(false, false, true);
  return <ClasificacionVista todas={todas} orden={orden} mioId={null} base="/demo" />;
}
