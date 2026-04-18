import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import './pages/main/componets/Body.tsx'
import {BrowserRouter} from "react-router-dom";
import Links from "./Links.tsx";
import { ThemeProvider } from "./lib/ThemeContext.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <Links/>
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
)
