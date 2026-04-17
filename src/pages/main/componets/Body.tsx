import style from './Body.module.css';
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { readActivePhone, writeActivePhone } from "../../../lib/activeUserStorage";
import {
    clearCachedObjectiveKcal,
    readCachedObjectiveKcal,
    readCachedTodayProgress,
    writeCachedObjectiveKcal,
    writeCachedTodayProgress,
} from "../../../lib/objectiveProgressStorage";
import {
    apiNutritionToMealUi,
    type ApiNutrition,
    type MealUiData,
} from "../../../lib/mealNutritionMapper";
import { healthApiUrl } from "../../../lib/healthApi";

type TodayMealRow = { id: string; logged_at: string; nutrition: ApiNutrition };

function formatLoggedAtLocal(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString("es-MX", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export const Body = () => {
    const navigate = useNavigate();

    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [kcalValue, setKcalValue] = useState(2100);
    /** Suma de kcal del día según el API (consumos con timestamp UTC de hoy). */
    const [consumedTodayKcal, setConsumedTodayKcal] = useState(0);
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [phoneNumberInput, setPhoneNumberInput] = useState("");
    /** No permitir cerrar el modal de cliente hasta registrar teléfono (primer arranque sin LS). */
    const [lockClientModal, setLockClientModal] = useState(false);
    /** No permitir cerrar el modal de meta hasta guardar (objetivo ausente en servidor). */
    const [lockKcalModal, setLockKcalModal] = useState(false);

    const [activeClient, setActiveClient] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [nutritionData, setNutritionData] = useState<MealUiData | null>(null);
    /** Objeto `nutrition` crudo del último análisis (cuerpo de POST /meal/log). */
    const [pendingLogNutrition, setPendingLogNutrition] = useState<ApiNutrition | null>(null);
    const [mealAlreadyLogged, setMealAlreadyLogged] = useState(false);
    const [isLoggingMeal, setIsLoggingMeal] = useState(false);

    const [todayMeals, setTodayMeals] = useState<TodayMealRow[]>([]);
    const [selectedTodayMealId, setSelectedTodayMealId] = useState<string | null>(null);

    const loadObjectiveForPhone = useCallback(async (phone: string) => {
        try {
            const response = await fetch(
                healthApiUrl(`/objective/${encodeURIComponent(phone)}`),
                { headers: { accept: "application/json" } }
            );
            if (response.status === 404) {
                clearCachedObjectiveKcal(phone);
                setKcalValue(2100);
                setIsModalOpen(true);
                setLockKcalModal(true);
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { objective?: string | null } = await response.json();
            const raw = data.objective;
            if (raw != null && String(raw).trim() !== "") {
                const n = Number(String(raw).trim());
                if (!Number.isNaN(n) && n > 0) {
                    const clamped = Math.min(4000, Math.max(1200, n));
                    setKcalValue(clamped);
                    writeCachedObjectiveKcal(phone, clamped);
                    setLockKcalModal(false);
                    setIsModalOpen(false);
                    return;
                }
            }
            clearCachedObjectiveKcal(phone);
            setKcalValue(2100);
            setIsModalOpen(true);
            setLockKcalModal(true);
        } catch (error) {
            console.error("Error al cargar objetivo calórico:", error);
        }
    }, []);

    const loadTodayCalories = useCallback(async (phone: string) => {
        try {
            const response = await fetch(
                healthApiUrl(`/today_calories/${encodeURIComponent(phone)}`),
                { headers: { accept: "application/json" } }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { consumed_kcal?: number } = await response.json();
            const n = Number(data.consumed_kcal);
            const consumed = Number.isFinite(n) && n >= 0 ? n : 0;
            setConsumedTodayKcal(consumed);
            writeCachedTodayProgress(phone, consumed);
        } catch (error) {
            console.error("Error al cargar calorías del día:", error);
            /* Mantener valor hidratado desde localStorage si la red falla. */
        }
    }, []);

    const loadTodayMeals = useCallback(async (phone: string) => {
        try {
            const response = await fetch(
                healthApiUrl(`/meals/today/${encodeURIComponent(phone)}`),
                { headers: { accept: "application/json" } }
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: { items?: TodayMealRow[] } = await response.json();
            const items = Array.isArray(data.items) ? data.items : [];
            setTodayMeals(items);
            setSelectedTodayMealId((prev) => {
                if (!prev) return null;
                return items.some((i) => i.id === prev) ? prev : null;
            });
        } catch (error) {
            console.error("Error al cargar comidas del día:", error);
            setTodayMeals([]);
        }
    }, []);

    useEffect(() => {
        const phone = readActivePhone();
        if (!phone) {
            setLockClientModal(true);
            setIsAddClientModalOpen(true);
            return;
        }
        setActiveClient(phone);
        const cachedGoal = readCachedObjectiveKcal(phone);
        if (cachedGoal !== null) {
            setKcalValue(cachedGoal);
        }
        setConsumedTodayKcal(readCachedTodayProgress(phone));
        void loadObjectiveForPhone(phone);
        void loadTodayCalories(phone);
        void loadTodayMeals(phone);
    }, [loadObjectiveForPhone, loadTodayCalories, loadTodayMeals]);

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadImage = async () => {
        if (!selectedFile) return;

        const userId = activeClient.trim();
        if (!userId) {
            return;
        }

        setIsUploadingImage(true);

        try {
            const base64Image = await convertToBase64(selectedFile);
            const mimeType = selectedFile.type;

            const response = await fetch(healthApiUrl(`/image/${encodeURIComponent(userId)}`), {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_base64: base64Image,
                    mime_type: mimeType
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data: { nutrition?: ApiNutrition } = await response.json();
            const nutrition = data.nutrition;
            if (!nutrition || typeof nutrition !== "object") {
                throw new Error("Respuesta sin nutrition");
            }

            setSelectedTodayMealId(null);
            setPendingLogNutrition(nutrition);
            setNutritionData(apiNutritionToMealUi(nutrition));
            setMealAlreadyLogged(false);
        } catch (error) {
            console.error("Error al subir la imagen:", error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleLogMeal = async () => {
        const userId = activeClient.trim();
        if (!userId || !pendingLogNutrition) {
            return;
        }
        if (mealAlreadyLogged) return;

        setIsLoggingMeal(true);
        try {
            const response = await fetch(healthApiUrl(`/meal/log/${encodeURIComponent(userId)}`), {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nutrition: pendingLogNutrition }),
            });
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            setMealAlreadyLogged(true);
            void loadTodayCalories(userId);
            void loadTodayMeals(userId);
        } catch (error) {
            console.error("Error al registrar comida:", error);
        } finally {
            setIsLoggingMeal(false);
        }
    };

    const handleSaveGoal = async () => {
        const userId = activeClient.trim();
        if (!userId) return;

        setIsSavingGoal(true);

        try {
            const response = await fetch(healthApiUrl(`/set_objective/${encodeURIComponent(userId)}`), {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ objective: kcalValue.toString() })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            writeCachedObjectiveKcal(userId, kcalValue);
            setLockKcalModal(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error al guardar el objetivo calórico:", error);
        } finally {
            setIsSavingGoal(false);
        }
    };

    const handleSaveClient = () => {
        const trimmed = phoneNumberInput.trim();
        if (!trimmed) return;

        writeActivePhone(trimmed);
        setActiveClient(trimmed);
        setIsAddClientModalOpen(false);
        setPhoneNumberInput("");
        setLockClientModal(false);

        setNutritionData(null);
        setPendingLogNutrition(null);
        setMealAlreadyLogged(false);
        setTodayMeals([]);
        setSelectedTodayMealId(null);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        const cachedGoal = readCachedObjectiveKcal(trimmed);
        setKcalValue(cachedGoal ?? 2100);
        setConsumedTodayKcal(readCachedTodayProgress(trimmed));

        void loadObjectiveForPhone(trimmed);
        void loadTodayCalories(trimmed);
        void loadTodayMeals(trimmed);
    };

    const openClientModal = useCallback(() => {
        setLockClientModal(false);
        setPhoneNumberInput(activeClient.trim() ? activeClient : "");
        setIsAddClientModalOpen(true);
    }, [activeClient]);

    const displayMeal = useMemo((): MealUiData | null => {
        if (selectedTodayMealId) {
            const row = todayMeals.find((m) => m.id === selectedTodayMealId);
            if (row?.nutrition && typeof row.nutrition === "object") {
                return apiNutritionToMealUi(row.nutrition);
            }
        }
        return nutritionData;
    }, [selectedTodayMealId, todayMeals, nutritionData]);

    const kcalConsumedDisplay = new Intl.NumberFormat("es-MX").format(Math.round(consumedTodayKcal));
    const kcalGoalDisplay = new Intl.NumberFormat("es-MX").format(kcalValue);
    const todayProgressPercent =
        kcalValue > 0 ? Math.min(100, (consumedTodayKcal / kcalValue) * 100) : 0;

    return (
        <div className="min-h-screen">
            <div className="flex h-screen overflow-hidden">
                {mobileNavOpen ? (
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
                        onClick={() => setMobileNavOpen(false)}
                    />
                ) : null}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 ${
                        mobileNavOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 p-5 sm:p-8 lg:pr-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--deep-green)] shadow-lg">
                                <span className="material-symbols-outlined text-white">restaurant</span>
                            </div>
                            <h2 className="truncate text-xl font-extrabold tracking-tight text-[var(--deep-green)] sm:text-2xl">
                                Mentor nutricional
                            </h2>
                        </div>
                        <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-white lg:hidden"
                            aria-label="Cerrar menú lateral"
                            onClick={() => setMobileNavOpen(false)}
                        >
                            <span className="material-symbols-outlined text-[22px]">close</span>
                        </button>
                    </div>
                    <nav className="mt-2 flex-1 space-y-2 px-4 sm:px-6">
                        <a
                            className={`${style.sidebarItemActive} flex items-center gap-4 rounded-xl px-4 py-3 font-bold transition-all`}
                            href="#"
                            onClick={() => setMobileNavOpen(false)}
                        >
                            <span className="material-symbols-outlined">grid_view</span>
                            Dashboard
                        </a>

                        <button
                            type="button"
                            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left font-medium text-[var(--text-muted)] transition-all hover:bg-white/50"
                            onClick={() => {
                                setMobileNavOpen(false);
                                navigate("/agente");
                            }}
                        >
                            <span className="material-symbols-outlined">person</span>
                            Agente nutricional
                        </button>
                    </nav>
                    <div className="p-4 sm:p-6">
                        <div className="rounded-2xl border border-[var(--card-border)] bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-3">
                                <div
                                    className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                                    style={{
                                        backgroundImage:
                                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD02QcWR7IUOWs8xA9AXXYdXyTRB-HqgxQoFkaR4nQaT4SmaKXeATVLa6OOCAmLlO8egPC19e4UZFMI6L1MoQYdeGKyhIyWMf9U63rienxBTSB5Z9NRfN061qGbUKb2OCGqYiYHO2dQYdv92AeQqhCPc3oipNoStgHbRqWIr_IGt__X0gry4EeWAb6CbPRa3_39s2n6HWvo6B7KOuwyNIGdHwwi5EfyMoSukLIr3Z_y1LFIuCz-uAPnZnpDNsb6F-MNAKR65EZXU4OU')",
                                    }}
                                />
                                <div className="min-w-0 overflow-hidden">
                                    <p className="truncate text-sm font-bold" title={activeClient}>
                                        {activeClient || "Sin Cliente"}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-[var(--light-green)]">Pro Client</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="relative min-w-0 flex-1 overflow-y-auto">
                    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[var(--card-border)] bg-white/80 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-10 lg:py-6">
                        <div className="flex min-w-0 items-start gap-3">
                            <button
                                type="button"
                                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--deep-green)] hover:bg-[var(--bg-light)] lg:hidden"
                                aria-label="Abrir menú"
                                onClick={() => setMobileNavOpen(true)}
                            >
                                <span className="material-symbols-outlined text-[24px]">menu</span>
                            </button>
                            <div className="min-w-0">
                                <h1 className="break-words text-2xl font-extrabold text-[var(--deep-green)] sm:text-3xl">
                                    Meal Analyzer
                                </h1>
                                <p className="text-sm font-medium text-[var(--text-muted)] sm:text-base">
                                    Analyze your intake with professional accuracy
                                </p>
                                <div className="mt-3 xl:hidden">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                        Progreso hoy
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-extrabold text-[var(--deep-green)] sm:text-sm">
                                            {kcalConsumedDisplay} / {kcalGoalDisplay} kcal
                                        </span>
                                        <div className="h-2 min-w-[6rem] flex-1 max-w-[10rem] overflow-hidden rounded-full border border-[var(--card-border)] bg-[var(--bg-light)]">
                                            <div
                                                className="h-full bg-[var(--light-green)] transition-[width] duration-300 ease-out"
                                                style={{ width: `${todayProgressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 lg:gap-6">
                            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                                {activeClient.trim() ? (
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={openClientModal}
                                            title={activeClient}
                                            aria-label={`Cliente activo: ${activeClient}`}
                                            className="flex items-center gap-2 max-w-[220px] px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-light)] text-[var(--deep-green)] text-sm font-semibold shadow-sm hover:border-[var(--deep-green)] transition-colors text-left"
                                        >
                                            <span className="material-symbols-outlined text-[20px] shrink-0">phone</span>
                                            <span className="truncate">{activeClient}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openClientModal}
                                            aria-label="Cambiar número de cliente"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--deep-green)] text-[var(--deep-green)] text-sm font-semibold hover:bg-[var(--deep-green)] hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openClientModal}
                                        className="flex items-center gap-2 rounded-lg bg-[var(--deep-green)] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-green-900/20 transition-colors hover:bg-[var(--light-green)] sm:px-4 sm:text-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">person_add</span>
                                        Agregar cliente
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLockKcalModal(false);
                                        setIsModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-200 transition-opacity hover:opacity-90 dark:bg-blend-darken dark:shadow-none sm:px-4 sm:text-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">tune</span>
                                    <span className="hidden min-[380px]:inline">Meta Kcal</span>
                                </button>
                            </div>

                            <div className="hidden border-l border-[var(--card-border)] pl-6 text-right xl:block">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Today's Progress</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-extrabold text-[var(--deep-green)]">
                                        {kcalConsumedDisplay} / {kcalGoalDisplay} kcal
                                    </span>
                                    <div className="w-32 h-2 bg-[var(--bg-light)] rounded-full overflow-hidden border border-[var(--card-border)]">
                                        <div
                                            className="bg-[var(--light-green)] h-full transition-[width] duration-300 ease-out"
                                            style={{ width: `${todayProgressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--bg-light)] text-[var(--deep-green)] transition-colors hover:bg-white sm:h-12 sm:w-12"
                            >
                                <span className="material-symbols-outlined text-[22px] sm:text-[24px]">notifications</span>
                            </button>
                        </div>
                    </header>

                    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:space-y-10 lg:p-10">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
                            {/* Columna Izquierda */}
                            <div className="space-y-6 sm:space-y-8 lg:col-span-7">

                                <div className="relative rounded-3xl border border-[var(--card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-10">

                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {!previewUrl ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--light-green)] bg-[var(--bg-light)] p-6 text-center transition-colors hover:bg-white sm:p-10 lg:p-12">
                                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md transition-transform group-hover:scale-110 sm:mb-6 sm:h-20 sm:w-20">
                                                <span className="material-symbols-outlined text-3xl text-[var(--deep-green)] sm:text-4xl">add_a_photo</span>
                                            </div>
                                            <h3 className="mb-2 text-lg font-extrabold sm:text-xl">Upload Meal Image</h3>
                                            <p className="mb-6 max-w-xs text-sm text-[var(--text-muted)] sm:mb-8 sm:text-base">
                                                Take a photo of your plate to get instant nutritional facts and insights.
                                            </p>
                                            <button className="pointer-events-none rounded-2xl bg-[var(--deep-green)] px-8 py-3 font-bold text-white shadow-lg shadow-green-900/10 transition-all hover:bg-[var(--light-green)] sm:px-10 sm:py-4">
                                                Choose File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-md mb-6 border border-gray-200">
                                                <img src={previewUrl} alt="Meal preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => {
                                                        setPreviewUrl(null);
                                                        setSelectedFile(null);
                                                        setNutritionData(null);
                                                        setPendingLogNutrition(null);
                                                        setMealAlreadyLogged(false);
                                                        setSelectedTodayMealId(null);
                                                    }}
                                                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>

                                            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="rounded-xl border-2 border-[var(--card-border)] px-5 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:px-6"
                                                >
                                                    Cambiar Foto
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleUploadImage}
                                                    disabled={isUploadingImage}
                                                    className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-lg transition-all sm:px-8
                                                        ${isUploadingImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--deep-green)] hover:bg-[var(--light-green)]'}`}
                                                >
                                                    {isUploadingImage ? 'Analizando...' : (
                                                        <>
                                                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                                            Analizar Plato
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-[var(--card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="flex items-center gap-2 text-lg font-extrabold text-[var(--deep-green)] sm:gap-3 sm:text-xl">
                                            <span className="material-symbols-outlined text-[var(--light-green)]">restaurant_menu</span>
                                            Comidas de hoy
                                        </h3>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                                            Día UTC
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mb-4">
                                        Lista de lo registrado en el diario. Al cambiar el día (UTC) la lista se vacía sola.
                                    </p>
                                    {todayMeals.length === 0 ? (
                                        <div className="text-center p-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl text-sm">
                                            Aún no hay comidas registradas hoy.
                                        </div>
                                    ) : (
                                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                                            {todayMeals.map((row) => {
                                                const kcal = Number(row.nutrition?.calorias_totales_kcal);
                                                const title =
                                                    String(row.nutrition?.nombre_platillo ?? "Comida").slice(0, 80) ||
                                                    "Comida";
                                                const selected = selectedTodayMealId === row.id;
                                                return (
                                                    <li key={row.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedTodayMealId((prev) =>
                                                                    prev === row.id ? null : row.id
                                                                )
                                                            }
                                                            className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                                                                selected
                                                                    ? "border-[var(--deep-green)] bg-[var(--bg-light)] ring-2 ring-[var(--light-green)]/40"
                                                                    : "border-[var(--card-border)] bg-white hover:border-[var(--light-green)]"
                                                            }`}
                                                        >
                                                            <div className="flex justify-between gap-2 items-start">
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                                                        {formatLoggedAtLocal(row.logged_at)}
                                                                    </p>
                                                                    <p className="font-extrabold text-[var(--deep-green)] text-sm leading-snug line-clamp-2">
                                                                        {title}
                                                                    </p>
                                                                </div>
                                                                <span className="shrink-0 text-sm font-black text-[var(--deep-green)]">
                                                                    {Number.isFinite(kcal) ? `${Math.round(kcal)}` : "—"}{" "}
                                                                    <span className="text-[9px] font-bold text-[var(--text-muted)]">kcal</span>
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {/* ---> CAMBIO 4: Renderizado condicional de los Ingredientes */}
                                <div className="rounded-3xl border border-[var(--card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                                    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="flex items-center gap-2 text-lg font-extrabold sm:gap-3 sm:text-xl">
                                            <span className="material-symbols-outlined text-[var(--light-green)]">fact_check</span>
                                            Detected Ingredients
                                        </h3>
                                        <button
                                            type="button"
                                            className="self-start border-b-2 border-[var(--light-green)] text-sm font-bold text-[var(--deep-green)] sm:self-auto"
                                        >
                                            Edit All
                                        </button>
                                    </div>
                                    {displayMeal?.dishTitle ? (
                                        <p className="text-sm font-extrabold text-[var(--deep-green)] mb-4 leading-snug">
                                            {displayMeal.dishTitle}
                                        </p>
                                    ) : null}
                                    <div className="space-y-4">
                                        {displayMeal ? (
                                            // Si tenemos datos de la API, iteramos sobre ellos
                                            displayMeal.ingredients.map((ingredient, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-light)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--card-border)] shadow-sm sm:h-14 sm:w-14">
                                                            {/* Ícono por defecto, podrías usar imágenes reales si la API las manda */}
                                                            <span className="material-symbols-outlined text-[var(--deep-green)]">restaurant_menu</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-extrabold text-[var(--deep-green)]">{ingredient.name}</p>
                                                            <p className="text-xs font-bold text-[var(--text-muted)]">{ingredient.portion}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3 border-t border-[var(--card-border)] pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:text-right">
                                                        <p className="text-lg font-black">
                                                            {ingredient.calories}{" "}
                                                            <span className="text-[10px] font-bold text-[var(--text-muted)]">KCAL</span>
                                                        </p>
                                                        <span
                                                            className={`rounded px-2 py-1 text-[9px] font-bold uppercase text-white ${ingredient.tagColor}`}
                                                        >
                                                            {ingredient.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            // Si no hay datos aún, mostramos un mensaje o un "placeholder"
                                            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                                <p>
                                                    Sube una imagen y analízala, o elige una comida en «Comidas de hoy» para ver el detalle.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha */}
                            <div className="space-y-6 sm:space-y-8 lg:col-span-5">
                                {selectedTodayMealId ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-[var(--deep-green)]/30 bg-[var(--bg-light)]">
                                        <p className="text-sm font-bold text-[var(--deep-green)]">
                                            Viendo una comida ya registrada (día UTC).
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTodayMealId(null)}
                                            className="shrink-0 px-4 py-2 rounded-xl border-2 border-[var(--deep-green)] text-[var(--deep-green)] text-sm font-bold hover:bg-[var(--deep-green)] hover:text-white transition-colors"
                                        >
                                            Volver al análisis actual
                                        </button>
                                    </div>
                                ) : null}

                                {/* ---> CAMBIO 5: Renderizado condicional de Macros */}
                                <div className="flex flex-col items-center rounded-3xl border border-[var(--card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-10">
                                    <h3 className="mb-6 flex w-full items-center gap-2 self-start text-lg font-extrabold sm:mb-10 sm:gap-3 sm:text-xl">
                                        <span className="material-symbols-outlined text-[var(--light-green)]">donut_large</span>
                                        Macro Balance
                                    </h3>

                                    {displayMeal ? (
                                        <>
                                            <div className="relative mx-auto mb-6 flex aspect-square w-full max-w-[min(18rem,88vw)] items-center justify-center sm:mb-10 sm:max-w-[16rem] lg:max-w-[18rem]">
                                                <div
                                                    className="h-full w-full rounded-full shadow-xl"
                                                    style={{ background: displayMeal.donutConicGradient }}
                                                />
                                                <div className="absolute inset-[12%] flex flex-col items-center justify-center rounded-full bg-white shadow-inner sm:inset-6">
                                                    <span className="text-4xl font-black text-[var(--deep-green)] sm:text-5xl">
                                                        {displayMeal.totalCalories}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                                        Total Calories
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid w-full grid-cols-3 gap-3 sm:gap-6">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--deep-green)]"></div>
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Protein</span>
                                                    </div>
                                                    <p className="text-xl font-black">{displayMeal.macros.protein.percentage}%</p>
                                                    <p className="text-[11px] font-bold text-[var(--light-green)]">{displayMeal.macros.protein.grams}g</p>
                                                </div>
                                                <div className="text-center border-x border-[var(--card-border)]">
                                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]"></div>
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Carbs</span>
                                                    </div>
                                                    <p className="text-xl font-black">{displayMeal.macros.carbs.percentage}%</p>
                                                    <p className="text-[11px] font-bold text-[var(--accent-blue)]">{displayMeal.macros.carbs.grams}g</p>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-orange)]"></div>
                                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Fats</span>
                                                    </div>
                                                    <p className="text-xl font-black">{displayMeal.macros.fats.percentage}%</p>
                                                    <p className="text-[11px] font-bold text-[var(--accent-orange)]">{displayMeal.macros.fats.grams}g</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full py-20 text-center text-gray-400">
                                            Esperando análisis...
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                    <div className="rounded-3xl border border-[var(--card-border)] bg-white p-4 sm:p-6">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3">Fibra</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black sm:text-2xl">{displayMeal ? `${displayMeal.fiber}g` : "--"}</span>
                                            <span className="material-symbols-outlined text-[var(--light-green)]">trending_up</span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-[var(--card-border)] bg-white p-4 sm:p-6">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3">Azúcar</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black sm:text-2xl">{displayMeal ? `${displayMeal.sugar}g` : "--"}</span>
                                            <span className="material-symbols-outlined text-[var(--accent-blue)]">cake</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-[var(--card-border)] bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                                    <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-[var(--deep-green)] sm:mb-6 sm:text-lg">
                                        <span className="material-symbols-outlined text-[var(--light-green)]">science</span>
                                        Micronutrientes
                                    </h3>
                                    {displayMeal ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {displayMeal.micronutrients.map((microRow) => (
                                                <div
                                                    key={microRow.key}
                                                    className="p-4 rounded-2xl bg-[var(--bg-light)] border border-[var(--card-border)] text-center"
                                                >
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">{microRow.label}</p>
                                                    <p className="text-xl font-black text-[var(--deep-green)]">
                                                        {new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(microRow.value)}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)]">{microRow.unit}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 py-4">Esperando análisis…</p>
                                    )}
                                </div>

                                {displayMeal?.notes ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-950 leading-relaxed">
                                        <p className="text-[10px] font-bold uppercase text-amber-800 mb-2 tracking-wide">Notas</p>
                                        {displayMeal.notes}
                                    </div>
                                ) : null}

                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <button
                                        type="button"
                                        onClick={handleLogMeal}
                                        disabled={
                                            !!selectedTodayMealId ||
                                            !pendingLogNutrition ||
                                            mealAlreadyLogged ||
                                            isLoggingMeal
                                        }
                                        className={`flex flex-1 items-center justify-center gap-3 rounded-2xl py-4 text-sm font-bold shadow-lg transition-all sm:py-5 sm:text-base
                                            ${
                                                !!selectedTodayMealId ||
                                                !pendingLogNutrition ||
                                                mealAlreadyLogged ||
                                                isLoggingMeal
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-[var(--deep-green)] text-white hover:bg-[var(--light-green)]"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">save</span>
                                        {mealAlreadyLogged
                                            ? "Registrado en el diario"
                                            : isLoggingMeal
                                              ? "Guardando…"
                                              : "Registrar en el diario"}
                                    </button>
                                    <button
                                        type="button"
                                        className="flex h-14 items-center justify-center rounded-2xl border-2 border-[var(--card-border)] text-[var(--deep-green)] transition-colors hover:bg-[var(--bg-light)] sm:h-auto sm:w-20 sm:py-5"
                                    >
                                        <span className="material-symbols-outlined">share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* ... Modales se mantienen iguales ... */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity sm:items-center sm:p-6">
                    <div className="max-h-[90dvh] w-full max-w-[450px] overflow-y-auto rounded-3xl border border-[var(--card-border)] bg-white p-5 shadow-2xl animate-fade-in-up sm:p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-extrabold text-[var(--deep-green)] flex items-center gap-2">
                                <span className="material-symbols-outlined">tune</span>
                                Meta de Calorías
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    if (lockKcalModal) return;
                                    setIsModalOpen(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="mb-10">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6 text-center">
                                Ajustar Calorías Diarias
                            </p>
                            <div className="flex items-end justify-center gap-2 mb-8">
                                <span className="text-4xl font-black tracking-tighter text-[var(--deep-green)] sm:text-5xl md:text-6xl">
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
                            onClick={handleSaveGoal}
                            disabled={isSavingGoal}
                            className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 
                            ${isSavingGoal ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--deep-green)] hover:bg-[var(--light-green)]'}`}>
                            {isSavingGoal ? (
                                <span>Guardando...</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Guardar Meta
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {isAddClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity sm:items-center sm:p-6">
                    <div className="max-h-[90dvh] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-[var(--card-border)] bg-white p-5 shadow-2xl animate-fade-in-up sm:p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-extrabold text-[var(--deep-green)] flex items-center gap-2">
                                <span className="material-symbols-outlined">contact_phone</span>
                                {activeClient.trim() ? "Cambiar cliente" : "Registrar Cliente"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    if (lockClientModal && !activeClient.trim()) return;
                                    setIsAddClientModalOpen(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                aria-label="Cerrar"
                            >
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
                                    value={phoneNumberInput}
                                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                                    className="w-full px-4 py-3 outline-none text-gray-700 font-medium bg-transparent"
                                />
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleSaveClient}
                            className="w-full bg-[var(--deep-green)] text-white font-bold py-4 rounded-xl hover:bg-[var(--light-green)] transition-all shadow-lg flex justify-center items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">
                                {activeClient.trim() ? "save" : "add_circle"}
                            </span>
                            {activeClient.trim() ? "Actualizar cliente" : "Agregar Cliente"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};