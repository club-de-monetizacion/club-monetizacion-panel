import { notFound } from "next/navigation";
import { perfilDemo } from "@/lib/desafios-data";
import { CreadorVista } from "@/components/desafios/vistas/creador";

export const metadata = { title: "Perfil de creador — Demo" };

export default async function DemoCreador({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Como un visitante cualquiera: lo que su dueña ocultó, aquí también está oculto.
  const perfil = await perfilDemo(id, false);
  if (!perfil) notFound();
  return <CreadorVista perfil={perfil} base="/demo" />;
}
