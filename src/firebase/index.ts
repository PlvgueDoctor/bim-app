// Get Data
import * as Firestore from "firebase/firestore"
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getDocs, collection, addDoc } from "firebase/firestore" // Asegúrate de importar getDocs y collection desde Firestore
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { ToDo } from "../bim-components/TodoCreator"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCI6X9-xQ7RE1dQXgxGyh1gcSTqU0-_vFs",
  authDomain: "bim-dev-app-e0acb.firebaseapp.com",
  projectId: "bim-dev-app-e0acb",
  storageBucket: "bim-dev-app-e0acb.appspot.com",
  messagingSenderId: "962220324993",
  appId: "1:962220324993:web:5fa317a24911a6c639b580"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// Get Documents
export const firestoreDB = Firestore.getFirestore()
const storage = getStorage(app)

export function getCollection<T>(path: string) {
  return Firestore.collection(firestoreDB, path) as Firestore.CollectionReference<T>
}
export async function deleteDocument(path: string, id: string) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.deleteDoc(doc)
}

export async function updateDocument<T extends Record<string, any>>(path: string, id: string, data: T) {
  const doc = Firestore.doc(firestoreDB, `${path}/${id}`)
  await Firestore.updateDoc(doc, data)
}


// To-Do
export async function getTodos(projectId: string): Promise<ToDo[]> {
  const todosCollectionRef = collection(firestoreDB, `/projects/${projectId}/ToDo`)
  const querySnapshot = await getDocs(todosCollectionRef)
  
  const todos: ToDo[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    todos.push({
      id: doc.id,
      description: data.description,
      date: data.date.toDate ? data.date.toDate() : new Date(data.date), // Convierte a Date
      fragmentMap: data.fragmentMap,
      camera: data.camera,
      priority: data.priority,
      projectId: projectId
    } as ToDo)
  })

  return todos
}
export async function deleteTodo(projectId: string, todoId: string) {
  const docRef = Firestore.doc(firestoreDB, `/projects/${projectId}/ToDo/${todoId}`)
  await Firestore.deleteDoc(docRef)
}
export async function addTodoF(projectId: string, todo: { description: string; date: Date; priority: string }) {
  const todosCollectionRef = collection(firestoreDB, `/projects/${projectId}/ToDo`)
  const newTodo = {
    description: todo.description,
    date: Firestore.Timestamp.fromDate(todo.date), // Convierte la fecha a un Timestamp de Firestore
    priority: todo.priority
  }
  try {
    await addDoc(todosCollectionRef, newTodo)
    console.log("ToDo added successfully!")
  } catch (e) {
    console.error("Error adding ToDo: ", e)
  }
}

// Function to add IFC file, 1QFfgmVzqlkERobuOqYi
export async function addIFCFile(projectId: string, file: File) {
  const storageRef = ref(storage, `projects/${projectId}/IFCModels/${file.name}`)
  try {
    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file)
    // Get the file's URL
    const downloadURL = await getDownloadURL(snapshot.ref)

    // Save the file information in Firestore
    const ifcCollectionRef = collection(firestoreDB, `/projects/${projectId}/IFCModels`)
    await addDoc(ifcCollectionRef, {
      name: file.name,
      url: downloadURL,
      uploadedAt: Firestore.Timestamp.now()
    })

    console.log("IFC file uploaded successfully!")
  } catch (e) {
    console.error("Error uploading IFC file: ", e)
  }
}

export async function getIFCFiles(projectId: string): Promise<string[]> {
  const ifcCollectionRef = collection(firestoreDB, `/projects/${projectId}/IFCModels`)
  const querySnapshot = await getDocs(ifcCollectionRef)

  const fileUrls: string[] = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    if (data.url) {
      fileUrls.push(data.url)
    }
  })

  return fileUrls
}
