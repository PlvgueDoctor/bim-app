import * as React from "react"
import * as Router from "react-router-dom"
import * as Firestore from "firebase/firestore"
import { IProject, Project, ProjectStatus, UserRole } from "../classes/Project"
import { ProjectCard } from "./ProjectCard"
import { SearchBox } from "./SearchBox"
import { ProjectsManager } from "../classes/ProjectsManager"
import { getCollection } from "../firebase"

interface Props {
    projectsManager: ProjectsManager
}

const projectsCollection = getCollection<IProject>("/projects")


export function ProjectsPage(props: Props) {
    const [projects, setProjects] = React.useState<Project[]>(props.projectsManager.list)
    props.projectsManager.onProjectCreated = () => {setProjects([...props.projectsManager.list])}

    const getFirestoreProjects = async () => {
        const firebaseProjects = await Firestore.getDocs(projectsCollection)
        for (const doc of firebaseProjects.docs) {
            const data = doc.data()
            const project: IProject = {
                ...data,
                finishDate: (data.finishDate as unknown as Firestore.Timestamp).toDate()
            }
            try {
                props.projectsManager.newProject(project, doc.id)
            } catch (error) {
            }
        }
    }



    const projectCards = projects.map((project) => {
        return (
        <Router.Link to={`/project/${project.id}`} key={project.id}>
            <ProjectCard project={project} />
        </Router.Link>)
    })

    React.useEffect(() => {
        getFirestoreProjects()
    }, [projects])

    const onNewProjectClick = () => {
        const modal = document.getElementById("new-project-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) {return}
        modal.showModal()
    }
    const onFormSubit = (e: React.FormEvent) => {
        e.preventDefault()
        const projectForm = document.getElementById("new-project-form")
        if (!(projectForm && projectForm instanceof HTMLFormElement)) {return}
        const formData = new FormData(projectForm)
        const projectData: IProject = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            status: formData.get("status") as ProjectStatus,
            userRole: formData.get("userRole") as UserRole,
            finishDate: new Date(formData.get("finishDate") as string)
        }
        try {
            Firestore.addDoc(projectsCollection, projectData)
            console.log(projectsCollection)
            console.log(projectData)
            const project = props.projectsManager.newProject(projectData)
            projectForm.reset()
            const modal = document.getElementById("new-project-modal")
            if (!(modal && modal instanceof HTMLDialogElement)) {return}
            modal.close()
        } catch (err) {
            alert(err)
        }
    }

    const onProjectSearch = (value: string) => {
        setProjects(props.projectsManager.filterProjects(value))
    }

    return(
        <div className="page" id="projects-page" style={{ display: "flex" }}>
            <dialog id="new-project-modal">
                <form onSubmit={(e) => onFormSubit(e)} id="new-project-form">
                    <h2>New Project</h2>
                    <div className="input-list">
                        <div className="form-field-container">
                            <label>
                                <span className="material-icons-round">apartment</span>Name
                            </label>
                            <input name="name" type="text" placeholder="What's the name of your project?"/>
                            <p style={{color: "gray", fontSize: "var(--font-sm)",marginTop: "5px",fontStyle: "italic"}}>TIP: Give it a short name</p>
                        </div>
                        <div className="form-field-container">
                            <label>
                                <span className="material-icons-round">subject</span>Description
                            </label>
                            <textarea name="description" cols={30} rows={5} placeholder="Give your project a nice description! So people is jealous about it." defaultValue={""}/>
                        </div>
                        <div className="form-field-container">
                            <label>
                                <span className="material-icons-round">person</span>Role
                            </label>
                            <select name="userRole">
                                <option>Architect</option>
                                <option>Engineer</option>
                                <option>Developer</option>
                            </select>
                        </div>
                        <div className="form-field-container">
                            <label>
                                <span className="material-icons-round">not_listed_location</span>Status
                            </label>
                            <select name="status">
                                <option>Pending</option>
                                <option>Active</option>
                                <option>Finished</option>
                            </select>
                        </div>
                        <div className="form-field-container">
                            <label htmlFor="finishDate">
                                <span className="material-icons-round">calendar_month</span>Finish Date
                            </label>
                            <input name="finishDate" type="date" />
                        </div>
                        <div style={{ display: "flex", margin: "10px 0px 10px auto", columnGap: 10 }}>
                            <button type="button" onClick={() =>{
                                const modal = document.getElementById("new-project-modal")
                                if (modal && modal instanceof HTMLDialogElement) {
                                    modal.close()
                                }
                            }} style={{ backgroundColor: "transparent" }}>Cancel
                            </button>
                            <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }}>Accept</button>
                        </div>
                    </div>
                </form>
            </dialog>
            <header>
                <h2>Projects</h2>
                <SearchBox onChange={(value) => onProjectSearch(value)} />
                <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    columnGap: 15,
                    cursor: "pointer"
                }}
                >
                <span
                    id="import-projects-btn"
                    className="material-icons-round action-icon"
                    onClick={() => {props.projectsManager.importFromJSON()}}
                >
                    file_upload
                </span>
                <span
                    id="export-projects-btn"
                    className="material-icons-round action-icon"
                    onClick={() => {props.projectsManager.exportToJSON()}}
                >
                    file_download
                </span>
                <button onClick={onNewProjectClick} id="new-project-btn">
                    <span className="material-icons-round">add</span>New Project
                </button>
                </div>
            </header>
            {
                projects.length > 0 ? <div id="projects-list">{ projectCards }</div> : <p>There is no projects to display!</p>
            }
        </div>
    )
}