"use client";
import Reac, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { SquarePlus } from "lucide-react";
import { toast } from "react-toastify";
import { addUserToProject, getProjectsAssociatedWithUser } from "../actions";
import { useUser } from "@clerk/nextjs";
import { Project } from "@/type";
import ProjectComponent from "../components/ProjectComponent";
import EmptyState from "../components/EmptyState";

const page = () => {

    const [inviteCode, setInviteCode] = useState("")
    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string
    const [associatedProjects, setAssociatedProjects] = useState<Project[]>([])

    const fetchProjects = async (email: string) => {
        try {
            const associated = await getProjectsAssociatedWithUser(email)
            setAssociatedProjects(associated)
        } catch (error) {
            toast.error(`Erreur lors du chargement des projets:`)
        }
    }

    useEffect(() => {
        if (email) {
            fetchProjects(email)
        }
    }, [email])

    const handleSubmit = async () => {
        try {
            if (inviteCode != "") {
                await addUserToProject(email, inviteCode)
                toast.success("Vous avez rejoint le projet avec succès")
            } else {
                toast.error("Veuillez entrer un code d'invitation")
            }
        } catch (error) {
            toast.error('Code invalide ou vous appartenez déjà à ce projet')
        }
    }

    return (
        <Wrapper>
            <div className="flex">
                <div className="mb-4">
                    <input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        type="text"
                        placeholder="Code d'invitation"
                        className="w-full p-2 input input-bordered" />
                </div>
                <button className="btn btn-primary ml-4" onClick={handleSubmit}>
                    Rejoindre <SquarePlus className="w-4" />
                </button>
            </div>

            <div>
                {associatedProjects.length > 0 ? (
                    <ul className="w-full grid md:grid-cols-3 gap-6">
                        {
                            associatedProjects.map((project) => (
                                <li key={project.id}>
                                    <ProjectComponent project={project} admin={0} style={true}></ProjectComponent>
                                </li>
                            ))
                        }
                    </ul>
                ) : (
                    <div>
                        <EmptyState
                            imageSrc='/empty-project.png'
                            imageAlt="Picture of an empty project"
                            message="Aucun projet associé" />
                    </div>
                )}
            </div>

        </Wrapper>
    )
}

export default page