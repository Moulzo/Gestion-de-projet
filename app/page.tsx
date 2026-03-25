"use client";

import { useEffect, useState } from "react";
import Wrapper from "./components/Wrapper";
import { FolderKanban } from "lucide-react";
import { createProject, deleteProjectById, getProjectsCreatedByUSer } from "./actions";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { Project } from "@/type";
import ProjectComponent from "./components/ProjectComponent";
import EmptyState from "./components/EmptyState";

export default function Home() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async (email: string) => {
    try {
      const myproject = await getProjectsCreatedByUSer(email);
      setProjects(myproject);
    } catch (error) {
      console.error(`Erreur lors du chargement des projets:`, error);
    }
  };

  useEffect(() => {
    if (email) {
      fetchProjects(email);
    }
  }, [email]);

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectById(projectId);
      await fetchProjects(email);
      toast.success("Projet supprimé !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      const modal = document.getElementById("my_modal_3") as HTMLDialogElement;
      await createProject(name, description, email);

      if (modal) {
        modal.close();
      }

      setName("");
      setDescription("");
      fetchProjects(email);
      toast.success("Projet créé");
    } catch (error) {
      console.error(`Error creating project:`, error);
      toast.error("Erreur lors de la création du projet");
    }
  };

  return (
    <Wrapper>
      <div>
        <button
          className="btn btn-soft btn-primary border border-base-300 mb-6"
          onClick={() =>
            (document.getElementById("my_modal_3") as HTMLDialogElement).showModal()
          }
        >
          Nouveau Projet <FolderKanban />
        </button>

        <dialog id="my_modal_3" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>

            <h3 className="font-bold text-lg">Nouveau Projet</h3>
            <p className="py-4">
              Décrivez votre projet simplement grâce à la description
            </p>

            <div>
              <input
                placeholder="Nom du projet"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-base-300 input input-bordered w-full mb-4 placeholder:text-sm"
                required
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-2 textarea textarea-bordered border border-base-300 w-full textarea-md placeholder:text-sm"
                required
              />

              <button className="btn btn-primary" onClick={handleSubmit}>
                Nouveau Projet <FolderKanban />
              </button>
            </div>
          </div>
        </dialog>

        <div className="w-full">
          {projects.length > 0 ? (
            <ul className="w-full grid md:grid-cols-3 gap-6">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectComponent
                    project={project}
                    admin={1}
                    style={true}
                    onDelete={deleteProject}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <EmptyState
                imageSrc="/empty-project.png"
                imageAlt="Picture of an empty project"
                message="Aucun projet créé"
              />
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}