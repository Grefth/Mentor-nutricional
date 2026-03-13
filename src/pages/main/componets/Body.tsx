import style from './Body.module.css';
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const Body = () => {
    const navigate = useNavigate();

    // 1. Estados para el modal de calorías
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [kcalValue, setKcalValue] = useState(2100);

    // 2. Estados para el modal de "Agregar Cliente"
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [phoneNumberInput, setPhoneNumberInput] = useState("");

    // 3. NUEVO: Estado para el Cliente Activo en el Sidebar (inicia con un nombre por defecto)
    const [activeClient, setActiveClient] = useState("");



    // 5. NUEVO: Función para guardar el cliente
    const handleSaveClient = () => {
        if (phoneNumberInput.trim() !== "") {
            // Reemplazamos el nombre con el número de teléfono
            setActiveClient(phoneNumberInput);

            // Cerramos modal y limpiamos el input
            setIsAddClientModalOpen(false);
            setPhoneNumberInput("");
        } else {
            // Opcional: Podrías poner una alerta si intentan guardar vacío
            console.warn("El número no puede estar vacío");
        }
    };

    return (
        <div className="min-h-screen">
            <div className="flex h-screen overflow-hidden">
                <aside className="w-72 flex flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
                    <div className="p-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--deep-green)] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white">restaurant</span>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--deep-green)]">Mentor nutricional</h2>
                    </div>
                    <nav className="flex-1 px-6 space-y-2 mt-4">
                        <a className={`${style.sidebarItemActive} flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all`}
                           href="#">
                            <span className="material-symbols-outlined">grid_view</span>
                            Dashboard
                        </a>

                        <button className="flex items-center gap-4 px-4 py-3 text-[var(--text-muted)] hover:bg-white/50 rounded-xl font-medium transition-all w-full text-left"
                                onClick={() => {navigate('/agente')}} >
                            <span className="material-symbols-outlined">person</span>
                            Agente nutricional
                        </button>
                    </nav>
                    <div className="p-6">
                        <div className="bg-white p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-cover bg-center"
                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD02QcWR7IUOWs8xA9AXXYdXyTRB-HqgxQoFkaR4nQaT4SmaKXeATVLa6OOCAmLlO8egPC19e4UZFMI6L1MoQYdeGKyhIyWMf9U63rienxBTSB5Z9NRfN061qGbUKb2OCGqYiYHO2dQYdv92AeQqhCPc3oipNoStgHbRqWIr_IGt__X0gry4EeWAb6CbPRa3_39s2n6HWvo6B7KOuwyNIGdHwwi5EfyMoSukLIr3Z_y1LFIuCz-uAPnZnpDNsb6F-MNAKR65EZXU4OU')" }}></div>
                                <div className="overflow-hidden">
                                    {/* 6. APLICAMOS EL ESTADO DEL CLIENTE AQUÍ (con truncate por si el número es muy largo) */}
                                    <p className="text-sm font-bold truncate" title={activeClient}>
                                        {activeClient}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-[var(--light-green)]">Pro Client</p>
                                </div>
                            </div>

                            {/* 7. CONECTAMOS LA FUNCIÓN AL BOTÓN DE SIGN OUT */}

                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto relative">
                    <header
                        className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-10 py-6 border-b border-[var(--card-border)] flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-extrabold text-[var(--deep-green)]">Meal Analyzer</h1>
                            <p className="text-[var(--text-muted)] font-medium">Analyze your intake with professional accuracy</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsAddClientModalOpen(true)}
                                    className="hidden sm:flex items-center gap-2 bg-[var(--deep-green)] text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-green-900/20 hover:bg-[var(--light-green)] transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                                    Nuevo Cliente
                                </button>

                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-blend-darken text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-slate-200 dark:shadow-none hover:opacity-90 transition-opacity">
                                    <span className="material-symbols-outlined text-[20px]">tune</span>
                                    Meta Kcal
                                </button>
                            </div>

                            <div className="text-right hidden xl:block border-l border-[var(--card-border)] pl-6">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Today's Progress</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-extrabold text-[var(--deep-green)]">1,640 / {kcalValue} kcal</span>
                                    <div className="w-32 h-2 bg-[var(--bg-light)] rounded-full overflow-hidden border border-[var(--card-border)]">
                                        <div className="bg-[var(--light-green)] h-full" style={{ width: `${(1640 / kcalValue) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-light)] text-[var(--deep-green)] border border-[var(--card-border)] hover:bg-white transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                        </div>
                    </header>

                    {/* ... Resto del contenido principal (Main Content) se mantiene igual ... */}
                    <div className="p-10 max-w-7xl mx-auto space-y-10">
                        {/* El resto del dashboard queda intacto (Upload Image, Macro Balance, etc.) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Columna Izquierda */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="bg-white rounded-3xl p-10 shadow-sm border border-[var(--card-border)]">
                                    <div className="border-2 border-dashed border-[var(--light-green)] bg-[var(--bg-light)] rounded-2xl p-12 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white transition-colors">
                                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl text-[var(--deep-green)]">add_a_photo</span>
                                        </div>
                                        <h3 className="text-xl font-extrabold mb-2">Upload Meal Image</h3>
                                        <p className="text-[var(--text-muted)] max-w-xs mb-8">Take a photo of your plate to get instant nutritional facts and insights.</p>
                                        <button className="bg-[var(--deep-green)] text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-green-900/10 hover:bg-[var(--light-green)] transition-all">
                                            Choose File
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-[var(--card-border)]">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-extrabold flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[var(--light-green)]">fact_check</span>
                                            Detected Ingredients
                                        </h3>
                                        <button className="text-[var(--deep-green)] font-bold text-sm border-b-2 border-[var(--light-green)]">
                                            Edit All
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-5 bg-[var(--bg-light)] rounded-2xl border border-[var(--card-border)]">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-xl bg-cover bg-center shadow-sm"
                                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAGJOogBqIYDrVXOf96NRwbBMGS4qiuTy-emvKtt9G1L0SgfSjQkSHVe6W2qAe2xtmkfhG7_aLiLMTFP9fkuAPghEa7Fj7ZjQX1P4rYazrbmiPc-Th-zn2oK1PwP9tG4hsVZUvn0hN5QG2schQ6u1pdNQHfG-7CZD0y4wdTKFVNgG5dxRPHClFIulfSzUWmIfwkW9ZwW_CoFyJs7cwrZCYStBssk9FN8H1d6hhxqqxj29jvEcuVtNMX31TUAMkDTqU6oqGrOsi8DhPD')" }}></div>
                                                <div>
                                                    <p className="font-extrabold text-[var(--deep-green)]">Atlantic Salmon</p>
                                                    <p className="text-xs font-bold text-[var(--text-muted)]">Grilled • 150g</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black">310 <span className="text-[10px] font-bold text-[var(--text-muted)]">KCAL</span></p>
                                                <span className="px-2 py-1 bg-[var(--deep-green)] text-white text-[9px] font-bold rounded uppercase">High Protein</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-5 bg-[var(--bg-light)] rounded-2xl border border-[var(--card-border)]">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-xl bg-cover bg-center shadow-sm"
                                                     style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMhoFYuy2J6u2f019f724AxPAtczh4a2UMh9_lg-IUOddf44bgTywcOGaftk3ZVtdRTI6VEMT7ma9mWvwVi8-AlrJkpEkBZooCxCX9BVik7tLM8wAWeBLRLPFgXPm2uVkHpi8oR4Hy0Zw-QWF2DatiIl_Qphdz9AglbfiTEc3j5ecfzkI-SkgZeIk1PQPPXWd_hUj5irUpzo31QpeRan05OetLiqxOsm80ta8zp0ztzwIUkJZPC1z2wIdQe-DEbWdxsbRL3kf2zLbH')" }}></div>
                                                <div>
                                                    <p className="font-extrabold text-[var(--deep-green)]">Organic Quinoa</p>
                                                    <p className="text-xs font-bold text-[var(--text-muted)]">Steamed • 100g</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black">120 <span className="text-[10px] font-bold text-[var(--text-muted)]">KCAL</span></p>
                                                <span className="px-2 py-1 bg-[var(--accent-blue)] text-white text-[9px] font-bold rounded uppercase">Complex Carb</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha */}
                            <div className="lg:col-span-5 space-y-8">
                                <div className="bg-white rounded-3xl p-10 shadow-sm border border-[var(--card-border)] flex flex-col items-center">
                                    <h3 className="text-xl font-extrabold self-start mb-10 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[var(--light-green)]">donut_large</span>
                                        Macro Balance
                                    </h3>
                                    <div className="relative w-72 h-72 flex items-center justify-center mb-10">
                                        <div className={`${style.customDonut} w-full h-full shadow-xl`}></div>
                                        <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                            <span className="text-5xl font-black text-[var(--deep-green)]">430</span>
                                            <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-[0.2em]">Total Calories</span>
                                        </div>
                                    </div>
                                    <div className="w-full grid grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--deep-green)]"></div>
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Protein</span>
                                            </div>
                                            <p className="text-xl font-black">35%</p>
                                            <p className="text-[11px] font-bold text-[var(--light-green)]">38g</p>
                                        </div>
                                        <div className="text-center border-x border-[var(--card-border)]">
                                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]"></div>
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Carbs</span>
                                            </div>
                                            <p className="text-xl font-black">30%</p>
                                            <p className="text-[11px] font-bold text-[var(--accent-blue)]">32g</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 mb-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-orange)]"></div>
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Fats</span>
                                            </div>
                                            <p className="text-xl font-black">35%</p>
                                            <p className="text-[11px] font-bold text-[var(--accent-orange)]">16g</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-[var(--card-border)]">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3">Fiber</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black">9.5g</span>
                                            <span className="material-symbols-outlined text-[var(--light-green)]">trending_up</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-[var(--card-border)]">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3">Sodium</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black">180mg</span>
                                            <span className="material-symbols-outlined text-[var(--accent-orange)]">warning</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex-1 bg-[var(--deep-green)] text-white font-bold py-5 rounded-2xl hover:bg-[var(--light-green)] transition-all shadow-lg flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined">save</span>
                                        Log to Food Diary
                                    </button>
                                    <button className="w-20 flex items-center justify-center border-2 border-[var(--card-border)] rounded-2xl text-[var(--deep-green)] hover:bg-[var(--bg-light)] transition-colors">
                                        <span className="material-symbols-outlined">share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal: Meta de Calorías */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-[450px] max-w-[90%] border border-[var(--card-border)] animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-extrabold text-[var(--deep-green)] flex items-center gap-2">
                                <span className="material-symbols-outlined">tune</span>
                                Meta de Calorías
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="mb-10">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 text-center">
                                Ajustar Calorías Diarias
                            </p>
                            <div className="flex items-end justify-center gap-2 mb-8">
                                <span className="text-6xl font-black text-[var(--deep-green)] tracking-tighter">
                                    {kcalValue}
                                </span>
                                <span className="text-lg font-bold text-[var(--light-green)] mb-2">kcal</span>
                            </div>
                            <div className="relative pt-1">
                                <input
                                    type="range"
                                    min="1200"
                                    max="4000"
                                    step="50"
                                    value={kcalValue}
                                    onChange={(e) => setKcalValue(Number(e.target.value))}
                                    className="w-full h-3 bg-[var(--bg-light)] rounded-lg appearance-none cursor-pointer accent-[var(--deep-green)]"
                                />
                                <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] mt-3">
                                    <span>1200 min</span>
                                    <span>4000 max</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full bg-[var(--deep-green)] text-white font-bold py-4 rounded-xl hover:bg-[var(--light-green)] transition-all shadow-lg flex justify-center items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Guardar Meta
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Agregar Cliente (Teléfono) */}
            {isAddClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-[400px] max-w-[90%] border border-[var(--card-border)] animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-extrabold text-[var(--deep-green)] flex items-center gap-2">
                                <span className="material-symbols-outlined">contact_phone</span>
                                Registrar Cliente
                            </h2>
                            <button
                                onClick={() => setIsAddClientModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-bold text-[var(--deep-green)] mb-3">
                                Número Telefónico
                            </label>

                            <div className="flex items-center border-2 border-[var(--card-border)] rounded-xl overflow-hidden focus-within:border-[var(--deep-green)] transition-colors">
                                <div className="bg-[var(--bg-light)] px-4 py-3 flex items-center justify-center border-r border-[var(--card-border)]">
                                    <span className="material-symbols-outlined text-[var(--text-muted)]">phone</span>
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Ej: +52 55 1234 5678"
                                    value={phoneNumberInput} // Usamos el estado dedicado al input
                                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                                    className="w-full px-4 py-3 outline-none text-gray-700 font-medium bg-transparent"
                                />
                            </div>

                        </div>

                        {/* 8. CONECTAMOS LA FUNCIÓN AL BOTÓN GUARDAR */}
                        <button
                            onClick={handleSaveClient}
                            className="w-full bg-[var(--deep-green)] text-white font-bold py-4 rounded-xl hover:bg-[var(--light-green)] transition-all shadow-lg flex justify-center items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Agregar Cliente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};