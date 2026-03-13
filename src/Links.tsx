import {Routes, Route} from "react-router";
import {Agente} from "./pages/agente/components/Agente.tsx";
import {Body} from "./pages/main/componets/Body.tsx";


export default function Links() {
    return (

        <Routes>
            <Route path="/" element={<Body/>}/>
            <Route path="/agente" element={<Agente/>}/>
        </Routes>

    )
}

