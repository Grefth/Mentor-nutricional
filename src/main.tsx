import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './pages/main/componets/Body.tsx'
import {BrowserRouter} from "react-router-dom";
import Links from "./Links.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Links/>
        </BrowserRouter>
    </StrictMode>,
)
