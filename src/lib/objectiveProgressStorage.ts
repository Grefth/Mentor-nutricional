/** Clave por usuario (teléfono) para objetivo y progreso diario. */

import { localCalendarDay } from "./browserDayContext";

function objectiveStorageKey(phone: string): string {
    return `mentor-nutricional:objectiveKcal:${encodeURIComponent(phone.trim())}`;
}

function progressStorageKey(phone: string): string {
    return `mentor-nutricional:progressKcal:${encodeURIComponent(phone.trim())}`;
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

type ProgressPayload = { consumed: number; calendarDay?: string; dayUtc?: string };

function progressCalendarDay(row: ProgressPayload): string | null {
    const c = row.calendarDay;
    if (typeof c === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c)) return c;
    const legacy = row.dayUtc;
    if (typeof legacy === "string" && /^\d{4}-\d{2}-\d{2}$/.test(legacy)) return legacy;
    return null;
}

export function readCachedTodayProgress(phone: string): number {
    try {
        const raw = localStorage.getItem(progressStorageKey(phone));
        if (!raw) return 0;
        const row = JSON.parse(raw) as ProgressPayload;
        if (!row) return 0;
        const d = progressCalendarDay(row);
        if (!d || d !== localCalendarDay()) return 0;
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
            calendarDay: localCalendarDay(),
        };
        localStorage.setItem(progressStorageKey(phone), JSON.stringify(payload));
    } catch {
        /* */
    }
}
