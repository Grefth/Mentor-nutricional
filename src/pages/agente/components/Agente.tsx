import "./Agente.module.css";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { readActivePhone } from "../../../lib/activeUserStorage";
import { healthApiUrl } from "../../../lib/healthApi";
import { ChatMarkdown } from "./ChatMarkdown";

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
            navigate("/");
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
                    <h1 className="text-xl font-bold leading-tight text-[#111827]">Asistente de chat</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Basado en tus datos</p>
                </div>
                <button
                    className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium text-[var(--text-muted)] transition-all hover:bg-white/50"
                    type="button"
                    onClick={() => navigate("/")}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Regresar
                </button>
            </aside>

            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#FFFFFF]">
                <div className="flex shrink-0 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 py-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-white"
                        aria-label="Regresar al inicio"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold text-[#111827]">Asistente nutricional</h1>
                        <p className="truncate text-xs text-[var(--text-muted)]">Basado en tus datos</p>
                    </div>
                </div>

                <header className="z-10 shrink-0 px-4 pb-2 pt-3 sm:p-6 sm:pb-2 sm:pt-4">
                    <div className="header-banner relative h-28 w-full overflow-hidden rounded-2xl shadow-md sm:h-36 lg:h-40">
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
                            style={{
                                backgroundImage:
                                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSMFI0HYCHsImwmTUzwKs6NhvIKeJ4fEnc5CaSHUqygjlF2xMqbtOIQAoVXC_VY5o3fibXg4RtYhTAmb-hC3PjiLG6a5PpDI_0iC3N-uywYs4d4WUD6j9RENC2wz8j7bYLVx-JjnB_PPmHB2urXEDDItt3DQIL1w0T3bPSuKgg9-o4wkKanf9-0GiMUnG7UcPd6NSpVTozi4m_8lRX6aHQ4Z1M9V80Q1kiewt2PqlWiLpbGbaoiDe3cNAmf5Ki_zAG7rBynEMd1PPI')",
                            }}
                        />
                        <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                            <h2 className="mb-1 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                                Asistente nutricional
                            </h2>
                            <p className="flex items-center gap-2 text-xs font-medium text-white/80 sm:text-sm">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#00C853]" />
                                Conectado a tu historial
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:space-y-6 sm:px-6 sm:py-4" id="chat-container">
                    <div className="flex justify-center">
                        <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full uppercase tracking-wider">
                            Hoy
                        </span>
                    </div>

                    {messages.map((m) =>
                        m.role === "assistant" ? (
                            <div key={m.id} className="flex max-w-3xl items-start gap-2 sm:gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ai-bubble-border)] bg-[#F3F4F6] sm:h-9 sm:w-9">
                                    <span className="material-symbols-outlined text-[#2E7D32]">smart_toy</span>
                                </div>
                                <div className="flex flex-col gap-1 items-start min-w-0">
                                    <span className="ml-1 text-xs font-bold text-[#6B7280]">Asistente</span>
                                    <div className="ai-message rounded-2xl rounded-tl-none p-3 text-sm leading-relaxed shadow-sm break-words sm:p-4 sm:text-base">
                                        <ChatMarkdown content={m.content} variant="assistant" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={m.id} className="ml-auto flex max-w-3xl justify-end gap-2 sm:gap-3">
                                <div className="flex min-w-0 max-w-[min(92%,28rem)] flex-col items-end gap-1">
                                    <span className="mr-1 text-xs font-bold text-[#6B7280]">Tú</span>
                                    <div className="user-message rounded-2xl rounded-tr-none p-3 text-sm leading-relaxed shadow-sm break-words sm:p-4 sm:text-base [&_p]:font-medium">
                                        <ChatMarkdown content={m.content} variant="user" />
                                    </div>
                                </div>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--sidebar-border)] bg-[#E5E7EB] sm:h-9 sm:w-9">
                                    <span className="material-symbols-outlined text-[20px] text-[#4B5563] sm:text-[22px]">person</span>
                                </div>
                            </div>
                        )
                    )}

                    {loading ? (
                        <div className="flex max-w-3xl items-start gap-2 sm:gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ai-bubble-border)] bg-[#F3F4F6] sm:h-9 sm:w-9">
                                <span className="material-symbols-outlined animate-pulse text-[#2E7D32]">smart_toy</span>
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span className="ml-1 text-xs font-bold text-[#6B7280]">Asistente</span>
                                <div className="ai-message rounded-2xl rounded-tl-none p-3 text-sm text-[#6B7280] shadow-sm sm:p-4">
                                    Pensando…
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div ref={chatEndRef} />
                </div>

                <div className="shrink-0 px-3 pb-3 pt-2 sm:p-6 sm:pt-2">
                    <div className="input-container flex items-end gap-1 rounded-xl p-2 shadow-sm sm:gap-2">
                        <button
                            type="button"
                            className="mb-0.5 self-end rounded-lg p-2 text-[#9CA3AF] transition-colors hover:bg-[#F9FAFB] hover:text-[#2E7D32] sm:p-2.5"
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
                                className="max-h-32 w-full resize-none border-0 bg-transparent p-0 text-sm text-[#111827] placeholder-[#9CA3AF] focus:ring-0 sm:text-base"
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
                    <p className="mt-2 text-center text-[11px] text-[#9CA3AF] sm:mt-3 sm:text-xs">
                        La IA puede equivocarse. Verifica información médica importante con tu nutricionista.
                    </p>
                </div>
            </main>
        </div>
    );
};
