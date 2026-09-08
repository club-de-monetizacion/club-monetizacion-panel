import { getProjects } from "@/lib/data";
import { ProjectsView } from "@/components/board/projects-view";

export default async function ProjectsPage() {
  const projects = await getProjects(true);
  return (
    <div className="animate-fade-in">
      <ProjectsView projects={projects} />
    </div>
  );
}
