import "./Agente.module.css";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { readActivePhone } from "../../../lib/activeUserStorage";
import { healthApiUrl } from "../../../lib/healthApi";
import { ChatMarkdown } from "./ChatMarkdown";
import { ThemeToggle } from "../../../components/ThemeToggle";

type ChatRole = "user" | "assistant";

type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
};

const MAX_HISTORY_MESSAGES = 24;

function newId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Incluye turnos previos en el prompt para que el modelo mantenga hilo conversacional. */
function buildMagicPrompt(messages: ChatMessage[]): string {
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
    if (trimmed.length === 1 && trimmed[0].role === "user") {
        return trimmed[0].content;
    }
    const lines = trimmed.map((m) =>
        m.role === "user" ? `Usuario: ${m.content}` : `Asistente: ${m.content}`
    );
    const last = trimmed[trimmed.length - 1];
    if (last.role === "user") {
        return (
            "Sigue el hilo de esta conversación. Responde de forma útil a la última pregunta o mensaje del usuario.\n\n" +
            lines.join("\n")
        );
    }
    return lines.join("\n");
}

async function readErrorDetail(response: Response): Promise<string> {
    const ct = response.headers.get("content-type") ?? "";
    try {
        if (ct.includes("application/json")) {
            const j: unknown = await response.json();
            if (j && typeof j === "object" && "detail" in j) {
                const d = (j as { detail: unknown }).detail;
                if (typeof d === "string") return d;
                if (Array.isArray(d)) {
                    return d
                        .map((x) =>
                            typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)
                        )
                        .join("; ");
                }
            }
            return JSON.stringify(j);
        }
        const t = await response.text();
        return t.trim() || `Error HTTP ${response.status}`;
    } catch {
        return `Error HTTP ${response.status}`;
    }
}

export const Agente = () => {
    const navigate = useNavigate();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sendingRef = useRef(false);

    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        {
            id: newId(),
            role: "assistant",
            content:
                "Hola. Soy tu asistente nutricional: puedo responder sobre tu alimentación, calorías y hábitos usando los datos que tienes registrados. ¿En qué te ayudo?",
        },
    ]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = useCallback(async () => {
        const text = draft.trim();
        if (!text || loading || sendingRef.current) return;

        const phone = readActivePhone();
        if (!phone) {
            navigate("/app");
            return;
        }

        sendingRef.current = true;
        const userMsg: ChatMessage = { id: newId(), role: "user", content: text };
        const thread = [...messages, userMsg];
        setMessages(thread);
        setDraft("");
        setLoading(true);

        try {
            const res = await fetch(healthApiUrl(`/magic/${encodeURIComponent(phone)}`), {
                method: "POST",
                headers: {
                    accept: "text/plain",
                    "content-type": "application/json",
                },
                body: JSON.stringify({ prompt: buildMagicPrompt(thread) }),
            });

            if (!res.ok) {
                const detail = await readErrorDetail(res);
                throw new Error(detail);
            }

            const answer = (await res.text()).trim();
            setMessages((prev) => [
                ...prev,
                {
                    id: newId(),
                    role: "assistant",
                    content: answer || "(Sin texto en la respuesta.)",
                },
            ]);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Error desconocido";
            setMessages((prev) => [
                ...prev,
                {
                    id: newId(),
                    role: "assistant",
                    content: `No pude completar la consulta: ${msg}`,
                },
            ]);
        } finally {
            sendingRef.current = false;
            setLoading(false);
            requestAnimationFrame(() => textareaRef.current?.focus());
        }
    }, [draft, loading, messages, navigate]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden antialiased lg:flex-row">
            <aside className="sidebar hidden h-full w-80 shrink-0 flex-col lg:flex">
                <div className="p-6 pb-2">
                    <h1 className="text-xl font-bold leading-tight text-[var(--text-dark)]">Asistente de chat</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Basado en tus datos</p>
                </div>
                <button
                    className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium text-[var(--text-muted)] transition-all hover:bg-white/50"
                    type="button"
                    onClick={() => navigate("/app")}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Regresar
                </button>
                <div className="flex items-center gap-4 rounded-xl px-4 py-3">
                    <ThemeToggle className="h-9 w-9" />
                    <span className="font-medium text-[var(--text-muted)]">Modo noche</span>
                </div>
            </aside>

            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-[#111a11]">
                <div className="flex shrink-0 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 py-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => navigate("/app")}
                        aria-label="Regresar al inicio"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold text-[var(--text-dark)]">Asistente nutricional</h1>
                        <p className="truncate text-xs text-[var(--text-muted)]">Basado en tus datos</p>
                    </div>
                    <ThemeToggle className="ml-auto h-9 w-9 shrink-0" />
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:space-y-6 sm:px-6 sm:py-4" id="chat-container">
                    <div className="flex justify-center">
                        <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-light)] px-3 py-1 rounded-full uppercase tracking-wider">
                            Hoy
                        </span>
                    </div>

                    {messages.map((m) =>
                        m.role === "assistant" ? (
                            <div key={m.id} className="flex max-w-3xl items-start gap-2 sm:gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#2d3b2d] bg-[#F1F8E9] dark:bg-[#1e2a1e] sm:h-9 sm:w-9">
                                    <span className="material-symbols-outlined text-[#2E7D32] dark:text-[#81C784]">smart_toy</span>
                                </div>
                                <div className="flex flex-col gap-1 items-start min-w-0">
                                    <span className="ml-1 text-xs font-bold text-gray-500 dark:text-gray-400">Asistente</span>
                                    <div className="rounded-2xl rounded-tl-none border border-[#E5E7EB] dark:border-[#2d3b2d] bg-white dark:bg-[#1e2a1e] text-gray-800 dark:text-[#E8F5E9] p-3 text-sm leading-relaxed shadow-sm break-words sm:p-4 sm:text-base">
                                        <ChatMarkdown content={m.content} variant="assistant" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={m.id} className="ml-auto flex max-w-3xl justify-end gap-2 sm:gap-3">
                                <div className="flex min-w-0 max-w-[min(92%,28rem)] flex-col items-end gap-1">
                                    <span className="mr-1 text-xs font-bold text-[var(--text-muted)]">Tú</span>
                                    <div className="user-message rounded-2xl rounded-tr-none p-3 text-sm leading-relaxed shadow-sm break-words sm:p-4 sm:text-base [&_p]:font-medium">
                                        <ChatMarkdown content={m.content} variant="user" />
                                    </div>
                                </div>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#2d3b2d] bg-[#F1F8E9] dark:bg-[#1e2a1e] sm:h-9 sm:w-9">
                                    <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400 sm:text-[22px]">person</span>
                                </div>
                            </div>
                        )
                    )}

                    {loading ? (
                        <div className="flex max-w-3xl items-start gap-2 sm:gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#2d3b2d] bg-[#F1F8E9] dark:bg-[#1e2a1e] sm:h-9 sm:w-9">
                                <span className="material-symbols-outlined animate-pulse text-[#2E7D32] dark:text-[#81C784]">smart_toy</span>
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span className="ml-1 text-xs font-bold text-gray-500 dark:text-gray-400">Asistente</span>
                                <div className="rounded-2xl rounded-tl-none border border-[#E5E7EB] dark:border-[#2d3b2d] bg-white dark:bg-[#1e2a1e] text-gray-500 dark:text-gray-400 p-3 text-sm shadow-sm sm:p-4">
                                    Pensando…
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div ref={chatEndRef} />
                </div>

                <div className="shrink-0 px-3 pb-3 pt-2 sm:p-6 sm:pt-2">
                    <div className="flex items-end gap-1 rounded-xl border border-[#E5E7EB] dark:border-[#4a6b4a] bg-white dark:bg-[#1e2a1e] p-2 shadow-sm ring-1 ring-transparent dark:ring-[#2d3b2d] sm:gap-2">
                        <button
                            type="button"
                            className="mb-0.5 self-end rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-light)] hover:text-[var(--deep-green)] sm:p-2.5"
                            aria-label="Adjuntar (próximamente)"
                            disabled
                        >
                            <span className="material-symbols-outlined text-[24px]">add_circle</span>
                        </button>
                        <div className="min-w-0 flex-1 py-2">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onKeyDown}
                                disabled={loading}
                                rows={1}
                                className="max-h-32 w-full resize-none border-0 bg-transparent p-0 text-sm text-gray-800 dark:text-[#E8F5E9] placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 sm:text-base"
                                placeholder="Escribe tu pregunta sobre tu alimentación…"
                            />
                        </div>
                        <div className="mb-0.5 self-end">
                            <button
                                type="button"
                                onClick={() => void sendMessage()}
                                disabled={loading || !draft.trim()}
                                className="send-button flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base"
                            >
                                <span className="hidden min-[360px]:inline">Enviar</span>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-[var(--text-muted)] sm:mt-3 sm:text-xs">
                        La IA puede equivocarse. Verifica información médica importante con tu nutricionista.
                    </p>
                </div>
            </main>
        </div>
    );
};
