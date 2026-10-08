import { personaDemoElegida } from "@/lib/desafios-data";
import { RetosVista } from "@/components/desafios/vistas/retos";
import { PersonaSelector } from "@/components/desafios/persona-selector";
import { SinDemo } from "@/components/desafios/sin-demo";

export const metadata = { title: "Retos — Demo" };

export default async function DemoRetos({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { personas, perfil } = await personaDemoElegida((await searchParams).p);
  if (!perfil) return <SinDemo />;
  return (
    <>
      <PersonaSelector personas={personas} actual={perfil.id} ruta="/demo/retos" />
      <RetosVista perfil={perfil} base="/demo" soloLectura />
    </>
  );
}
