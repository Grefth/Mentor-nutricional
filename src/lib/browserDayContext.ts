/** Zona IANA del navegador (p. ej. America/Mexico_City). */
export function browserIanaTimeZone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return typeof tz === "string" && tz.trim() !== "" ? tz.trim() : "UTC";
    } catch {
        return "UTC";
    }
}

/** Día civil local YYYY-MM-DD en el huso del sistema. */
export function localCalendarDay(d: Date = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Query string para GET de «hoy» alineado con el navegador. */
export function todayNutritionQueryParams(): string {
    return new URLSearchParams({
        tz: browserIanaTimeZone(),
        day: localCalendarDay(),
    }).toString();
}
