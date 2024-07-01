import * as React from "react"
import * as Router from "react-router-dom"
import { ViewerContext } from "./IFCViewer"

export function Sidebar(){
    const { viewer } = React.useContext(ViewerContext)
    return(
        <aside id="sidebar">
            <Router.Link to="/">
                <img id="company-logo" src="./assets/TextoIngeBIM.png" alt="IngeBIM"></img>
            </Router.Link>
            <ul id="nav-buttons">
                <Router.Link to="/">
                    <li><span className="material-symbols-outlined">apartment</span>Projects</li>
                </Router.Link>
                <Router.Link to="/project"></Router.Link>
                {/* <li><span className="material-symbols-outlined">group</span>Users</li> */}
            </ul>
        </aside>
    )
}