import { useTheme } from "../lib/ThemeContext";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo noche"}
            className={`flex items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-light)] hover:text-[var(--deep-green)] ${className}`}
        >
            <span className="material-symbols-outlined text-[22px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
        </button>
    );
}
