/** Clave por usuario (teléfono) para objetivo y progreso diario. */

function objectiveStorageKey(phone: string): string {
    return `mentor-nutricional:objectiveKcal:${encodeURIComponent(phone.trim())}`;
}

function progressStorageKey(phone: string): string {
    return `mentor-nutricional:progressKcal:${encodeURIComponent(phone.trim())}`;
}

function utcCalendarDay(): string {
    return new Date().toISOString().slice(0, 10);
}

export function readCachedObjectiveKcal(phone: string): number | null {
    try {
        const raw = localStorage.getItem(objectiveStorageKey(phone));
        if (raw == null || raw === "") return null;
        const n = Number(String(raw).trim());
        if (!Number.isFinite(n) || n <= 0) return null;
        return Math.min(4000, Math.max(1200, n));
    } catch {
        return null;
    }
}

export function writeCachedObjectiveKcal(phone: string, kcal: number): void {
    try {
        const clamped = Math.min(4000, Math.max(1200, Math.round(kcal)));
        localStorage.setItem(objectiveStorageKey(phone), String(clamped));
    } catch {
        /* quota / modo privado */
    }
}

export function clearCachedObjectiveKcal(phone: string): void {
    try {
        localStorage.removeItem(objectiveStorageKey(phone));
    } catch {
        /* */
    }
}

type ProgressPayload = { consumed: number; dayUtc: string };

export function readCachedTodayProgress(phone: string): number {
    try {
        const raw = localStorage.getItem(progressStorageKey(phone));
        if (!raw) return 0;
        const row = JSON.parse(raw) as ProgressPayload;
        if (!row || typeof row.dayUtc !== "string") return 0;
        if (row.dayUtc !== utcCalendarDay()) return 0;
        const n = Number(row.consumed);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
        return 0;
    }
}

export function writeCachedTodayProgress(phone: string, consumed: number): void {
    try {
        const payload: ProgressPayload = {
            consumed: Math.max(0, consumed),
            dayUtc: utcCalendarDay(),
        };
        localStorage.setItem(progressStorageKey(phone), JSON.stringify(payload));
    } catch {
        /* */
    }
}
