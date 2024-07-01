import { deleteDocument } from "../firebase"
import { IProject, Project } from "./Project"
export class ProjectsManager{
    list: Project[] = []
    onProjectCreated = (project: Project) => {}
    onProjectDeleted = (id: string) => {}
    onProjectEdit = (id: string) => {}

    filterProjects(value: string) {
        const filteredProjects = this.list.filter((project) => {
            return project.name.includes(value)
        })
        return filteredProjects
    }

    newProject(data: IProject, id?: string){
        //find name project
        const projectNames = this.list.map((project) =>{
            return project.name
        })
        const nameInUse = projectNames.includes(data.name)
        if (nameInUse){
            throw new Error(`A project with the name "${data.name}" alredy exists`)
        }
        const project = new Project(data, id)
        this.list.push(project)
        this.onProjectCreated(project)
        return project
    }


    getProject(id: string){
        const project = this.list.find((project) =>{
            return project.id === id
        })
        return project
    }
    deleteProject(id: string){
        const project = this.getProject(id)
        if (!project) {return}
        const remaining = this.list.filter((project) =>{
            return project.id !== id
        })
        console.log(this.list)
        this.list = remaining
        deleteDocument("/projects", id)
        this.onProjectDeleted(id)
        console.log(this.list)

    }
    setProject(id: string, data: Partial<IProject>) {
        const project = this.getProject(id)
        if (!project) {
            throw new Error(`Project with ID ${id} not found`)
        }
        if (data.name) project.name = data.name
        if (data.description) project.description = data.description
        if (data.status) project.status = data.status
        if (data.userRole) project.userRole = data.userRole
        if (data.finishDate) project.finishDate = data.finishDate
        this.onProjectEdit(id)
    }
    
    
    exportToJSON(fileName: string = "projects") {
        const json = JSON.stringify(this.list, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
    }    
    importFromJSON() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            const json = reader.result
            if (!json) { return }
            const projects: IProject[] = JSON.parse(json as string)
            for (const project of projects) {
                try {
                    this.newProject(project)
                } catch (error) {     
                }
            }
        })
        input.addEventListener('change', () => {
            const filesList = input.files
            if (!filesList) { return }
            reader.readAsText(filesList[0])
        })
        input.click()
    }
}