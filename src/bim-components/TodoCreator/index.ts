import * as React from "react"
import * as Router from "react-router-dom"
import * as OBC from "openbim-components"
import * as THREE from "three"
import { ProjectsManager } from "../../classes/ProjectsManager"
import * as Firestore from "firebase/firestore"
import { firestoreDB } from "../../firebase"
import { IProject } from "../../classes/Project"
import { TodoCard } from "./src/TodoCard"
import { getTodos, getCollection, addTodoF, deleteTodo } from "../../firebase"
import { getFirestore } from "firebase/firestore"
import { ProjectDetailsPage } from "../../react-components/ProjectDetailsPage"


type ToDoPriority = "Low" | "Medium" | "High"


export interface ToDo {
  id: string
  description: string
  date: Date
  fragmentMap: OBC.FragmentIdMap
  camera: { position: THREE.Vector3, target: THREE.Vector3 }
  priority: ToDoPriority
  projectId: string
}

export class TodoCreator extends OBC.Component<ToDo[]> implements OBC.UI {
  static uuid = "abd7f95b-809f-46ca-a804-80cc5d2219ec"
  enabled = true
  uiElement = new OBC.UIElement<{
    activationButton: OBC.Button
    todoList: OBC.FloatingWindow
  }>()
  private _components: OBC.Components
  private _list: ToDo[] = []

  constructor(components: OBC.Components) {
    super(components)
    this._components = components
    components.tools.add(TodoCreator.uuid, this)
    this.setUI()
  }

  async setup() {
    const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
    highlighter.add(`${TodoCreator.uuid}-priority-Low`, [new THREE.MeshStandardMaterial({ color: 0x59bc59 })])
    highlighter.add(`${TodoCreator.uuid}-priority-Normal`, [new THREE.MeshStandardMaterial({color: 0x597cff})])
    highlighter.add(`${TodoCreator.uuid}-priority-High`, [new THREE.MeshStandardMaterial({ color: 0xff7676 })])
  }

  
  deleteTodo(todoToDelete: ToDo, todoCard: TodoCard) {
    // Eliminar el ToDo de la lista
    deleteTodo(todoToDelete.projectId, todoToDelete.id)
    this._list = this._list.filter(todo => todo !== todoToDelete)

    // Eliminar la tarjeta de la interfaz de usuario
    const todoList = this.uiElement.get("todoList");
    todoList.removeChild(todoCard)
  }

  async addTodo(description: string, priority: ToDoPriority, id: string, projectId) {
    const camera = this._components.camera
    if (!(camera instanceof OBC.OrthoPerspectiveCamera)) {
      throw new Error("TodoCreator needs the OrthoPerspectiveCamera in order to work")
    }

    const position = new THREE.Vector3()
    camera.controls.getPosition(position)
    const target = new THREE.Vector3()
    camera.controls.getTarget(target)
    const todoCamera = { position, target }
    
    
    const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)

    const existingTodo = this._list.find(todo => todo.id === id);
    if (existingTodo) {
        console.warn('Todo with the same description and project already exists. Skipping addition.');
        return; // No agregamos el ToDo si ya existe uno igual
    }
    const todo: ToDo = {
      id,
      projectId,
      camera: todoCamera,
      description,
      date: new Date(),
      fragmentMap: highlighter.selection.select,
      priority
    }

    this._list.push(todo)

    const todoCard = new TodoCard(this._components)
    todoCard.description = todo.description
    todoCard.date = todo.date
    todoCard.onCardClick.add(() => {
      camera.controls.setLookAt(
        todo.camera.position.x,
        todo.camera.position.y,
        todo.camera.position.z,
        todo.camera.target.x,
        todo.camera.target.y,
        todo.camera.target.z,
        true
      )
      const fragmentMapLength = Object.keys(todo.fragmentMap).length
      if (fragmentMapLength === 0) {return}
      highlighter.highlightByID("select", todo.fragmentMap)
    })

    todoCard.onDeleteClick.add(() => {
      this.deleteTodo(todo, todoCard);
    });

    const todoList = this.uiElement.get("todoList")
    todoList.addChild(todoCard)
  }

  private async setUI() {
    const activationButton = new OBC.Button(this._components)
    activationButton.materialIcon = "construction"

    const newTodoBtn = new OBC.Button(this._components, { name: "Create" })
    activationButton.addChild(newTodoBtn)

    const form = new OBC.Modal(this._components)
    this._components.ui.add(form)
    form.title = "Create New ToDo"

    const descriptionInput = new OBC.TextArea(this._components)
    descriptionInput.label = "Description"
    form.slots.content.addChild(descriptionInput)

    const priorityDropdown = new OBC.Dropdown(this._components)
    priorityDropdown.label = "Priority"
    priorityDropdown.addOption("Low", "Normal", "High")
    priorityDropdown.value = "Normal"
    form.slots.content.addChild(priorityDropdown)

    form.slots.content.get().style.padding = "20px"
    form.slots.content.get().style.display = "flex"
    form.slots.content.get().style.flexDirection = "column"
    form.slots.content.get().style.rowGap = "20px"

    form.onAccept.add(() => {
      console.log(this._list[0])
      const firstTodo = this._list[0]
      const projectId = firstTodo ? firstTodo.projectId : null
      const randomId = this.generateUniqueId()
      // Obtén los valores de los inputs
      const description = descriptionInput.value
      const priority = priorityDropdown.value as ToDoPriority
      // Añade el nuevo ToDo
      this.addTodo(description, priority, randomId, projectId)
      // Limpia los inputs y oculta el formulario
      descriptionInput.value = ""
      form.visible = false
      // Asegúrate de pasar los valores correctos a addTodo
      if (projectId) {
        const todoData = {
          description: description,
          date: new Date(),  // Usamos la fecha actual para este ejemplo
          priority: priority
        }
        addTodoF(projectId, todoData)
      }else {
        console.error("El ID del proyecto no está definido.")
      }
    })
    
    form.onCancel.add(() => form.visible = false)

    newTodoBtn.onClick.add(() => form.visible = true)
    
    const todoList = new OBC.FloatingWindow(this._components)
    this._components.ui.add(todoList)
    todoList.visible = false
    todoList.title = "To-Do List"

    const todoListToolbar = new OBC.SimpleUIComponent(this._components)
    todoList.addChild(todoListToolbar)

    const colorizeBtn = new OBC.Button(this._components)
    colorizeBtn.materialIcon = "format_color_fill"
    todoListToolbar.addChild(colorizeBtn)

    const highlighter = await this._components.tools.get(OBC.FragmentHighlighter)
    colorizeBtn.onClick.add(() => {
      colorizeBtn.active = !colorizeBtn.active
      if (colorizeBtn.active) {
        for (const todo of this._list) {
          const fragmentMapLength = Object.keys(todo.fragmentMap).length
          if (fragmentMapLength === 0) {return}
          highlighter.highlightByID(`${TodoCreator.uuid}-priority-${todo.priority}`, todo.fragmentMap)
        }
      } else {
        highlighter.clear(`${TodoCreator.uuid}-priority-Low`) 
        highlighter.clear(`${TodoCreator.uuid}-priority-Normal`) 
        highlighter.clear(`${TodoCreator.uuid}-priority-High`)
      }
    })

    const todoListBtn = new OBC.Button(this._components, { name: "List" })
    activationButton.addChild(todoListBtn)
    todoListBtn.onClick.add(() => todoList.visible = !todoList.visible)
    
    this.uiElement.set({activationButton, todoList})
  }

  private generateUniqueId(): string {
    return '_' + Math.random().toString(36)
  }
  get(): ToDo[] {
    return this._list
  }

}
