/** Respuesta `nutrition` de POST /image/{phone} (esquema Gemini, español). */

export interface ApiMacronutrientes {
    proteina_g?: number;
    carbohidratos_g?: number;
    grasa_g?: number;
    fibra_g?: number;
    azucar_g?: number;
}

export interface ApiMicronutrientes {
    sodio_mg?: number;
    calcio_mg?: number;
    hierro_mg?: number;
    vitamina_c_mg?: number;
}

export interface ApiComponenteDetectado {
    nombre?: string;
    descripcion_porcion?: string;
    calorias_aprox_kcal?: number;
    etiqueta?: string;
}

export interface ApiNutrition {
    nombre_platillo?: string;
    calorias_totales_kcal?: number;
    tamaño_porcion_g?: number;
    macronutrientes?: ApiMacronutrientes;
    micronutrientes?: ApiMicronutrientes;
    componentes_detectados?: ApiComponenteDetectado[];
    notas?: string;
}

export interface MealIngredientRow {
    name: string;
    portion: string;
    calories: number;
    tag: string;
    tagColor: string;
}

export interface MealUiData {
    dishTitle: string;
    ingredients: MealIngredientRow[];
    totalCalories: number;
    macros: {
        protein: { percentage: number; grams: number };
        carbs: { percentage: number; grams: number };
        fats: { percentage: number; grams: number };
    };
    fiber: number;
    sodium: number;
    sugar: number;
    micronutrients: { key: string; label: string; value: number; unit: string }[];
    notes: string;
    /** `background` para un donut con `conic-gradient` (colores hex alineados al tema). */
    donutConicGradient: string;
}

const TAG_COLORS = [
    "bg-[var(--deep-green)]",
    "bg-[var(--accent-blue)]",
    "bg-[var(--accent-orange)]",
] as const;

const DEEP_GREEN = "#2E7D32";
const ACCENT_BLUE = "#0288D1";
const ACCENT_ORANGE = "#EF6C00";

function safeNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

/** Convierte `data.nutrition` del API en estado listo para la UI. */
export function apiNutritionToMealUi(raw: unknown): MealUiData {
    const nut = (raw && typeof raw === "object" ? raw : {}) as ApiNutrition;
    const m = nut.macronutrientes ?? {};
    const micro = nut.micronutrientes ?? {};

    const pG = safeNum(m.proteina_g);
    const cG = safeNum(m.carbohidratos_g);
    const fG = safeNum(m.grasa_g);
    const pK = pG * 4;
    const cK = cG * 4;
    const fK = fG * 9;
    const sumK = pK + cK + fK;

    let pp = 100 / 3;
    let cp = 100 / 3;
    let fp = 100 / 3;
    if (sumK > 0) {
        pp = (pK / sumK) * 100;
        cp = (cK / sumK) * 100;
        fp = (fK / sumK) * 100;
    }

    const endP = pp;
    const endC = pp + cp;
    const donutConicGradient = `conic-gradient(${DEEP_GREEN} 0% ${endP}%, ${ACCENT_BLUE} ${endP}% ${endC}%, ${ACCENT_ORANGE} ${endC}% 100%)`;

    const comps = Array.isArray(nut.componentes_detectados) ? nut.componentes_detectados : [];
    let ingredients: MealIngredientRow[];

    if (comps.length > 0) {
        ingredients = comps.map((c, i) => ({
            name: String(c?.nombre ?? "Componente").trim() || "Componente",
            portion: String(c?.descripcion_porcion ?? "—").trim() || "—",
            calories: Math.round(safeNum(c?.calorias_aprox_kcal)),
            tag:
                c?.etiqueta != null && String(c.etiqueta).trim() !== ""
                    ? String(c.etiqueta).trim()
                    : "Alimento",
            tagColor: TAG_COLORS[i % TAG_COLORS.length]!,
        }));
    } else {
        const total = Math.round(safeNum(nut.calorias_totales_kcal));
        const g = safeNum(nut.tamaño_porcion_g);
        ingredients = [
            {
                name: String(nut.nombre_platillo ?? "Platillo").trim() || "Platillo",
                portion: g > 0 ? `Porción aprox. • ${Math.round(g)} g` : "Porción estimada",
                calories: total,
                tag: "Plato completo",
                tagColor: TAG_COLORS[0]!,
            },
        ];
    }

    const micronutrients = [
        { key: "sodio", label: "Sodio", value: round1(safeNum(micro.sodio_mg)), unit: "mg" },
        { key: "calcio", label: "Calcio", value: round1(safeNum(micro.calcio_mg)), unit: "mg" },
        { key: "hierro", label: "Hierro", value: round1(safeNum(micro.hierro_mg)), unit: "mg" },
        { key: "vitC", label: "Vitamina C", value: round1(safeNum(micro.vitamina_c_mg)), unit: "mg" },
    ];

    return {
        dishTitle: String(nut.nombre_platillo ?? "").trim(),
        ingredients,
        totalCalories: Math.round(safeNum(nut.calorias_totales_kcal)),
        macros: {
            protein: { percentage: round1(pp), grams: round1(pG) },
            carbs: { percentage: round1(cp), grams: round1(cG) },
            fats: { percentage: round1(fp), grams: round1(fG) },
        },
        fiber: round1(safeNum(m.fibra_g)),
        sodium: Math.round(safeNum(micro.sodio_mg)),
        sugar: round1(safeNum(m.azucar_g)),
        micronutrients,
        notes: String(nut.notas ?? "").trim(),
        donutConicGradient,
    };
}
