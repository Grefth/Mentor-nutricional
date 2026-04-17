import {Routes, Route} from "react-router";
import {Agente} from "./pages/agente/components/Agente.tsx";
import {Body} from "./pages/main/componets/Body.tsx";
import {Landing} from "./pages/landing/Landing.tsx";


export default function Links() {
    return (

        <Routes>
            <Route path="/" element={<Landing/>}/>
            <Route path="/app" element={<Body/>}/>
            <Route path="/agente" element={<Agente/>}/>
        </Routes>

    )
}

