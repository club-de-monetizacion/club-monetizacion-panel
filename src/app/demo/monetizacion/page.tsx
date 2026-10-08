import { personaDemoElegida } from "@/lib/desafios-data";
import { MonetizacionVista } from "@/components/desafios/vistas/monetizacion";
import { PersonaSelector } from "@/components/desafios/persona-selector";
import { SinDemo } from "@/components/desafios/sin-demo";

export const metadata = { title: "Monetización — Demo" };

export default async function DemoMonetizacion({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { personas, perfil } = await personaDemoElegida((await searchParams).p);
  if (!perfil) return <SinDemo />;
  return (
    <>
      <PersonaSelector personas={personas} actual={perfil.id} ruta="/demo/monetizacion" />
      <MonetizacionVista perfil={perfil} soloLectura />
    </>
  );
}
