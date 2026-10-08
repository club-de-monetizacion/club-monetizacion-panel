import { personaDemoElegida } from "@/lib/desafios-data";
import { MiCaminoVista } from "@/components/desafios/vistas/mi-camino";
import { PersonaSelector } from "@/components/desafios/persona-selector";
import { SinDemo } from "@/components/desafios/sin-demo";

export default async function DemoMiCamino({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { personas, perfil } = await personaDemoElegida((await searchParams).p);
  if (!perfil) return <SinDemo />;
  return (
    <>
      <PersonaSelector personas={personas} actual={perfil.id} ruta="/demo" />
      <MiCaminoVista perfil={perfil} base="/demo" soloLectura />
    </>
  );
}
