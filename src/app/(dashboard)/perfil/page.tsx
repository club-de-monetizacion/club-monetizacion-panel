import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { ThemeForm } from "@/components/profile/theme-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--ink-0)]">Mi perfil</h2>
        <p className="text-sm text-[var(--ink-2)]">
          Personaliza tu información y la apariencia de tu panel.
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="glass-panel mt-5 rounded-xl p-5">
          <ProfileForm
            initialName={user.name ?? ""}
            initialBio={user.bio ?? ""}
            initialImage={user.image}
            email={user.email}
          />
        </TabsContent>

        <TabsContent value="apariencia" className="glass-panel mt-5 rounded-xl p-5">
          <ThemeForm
            initial={{
              accentColor: user.accentColor,
              backgroundColor: user.backgroundColor,
              backgroundType: user.backgroundType,
              particlesEnabled: user.particlesEnabled,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
