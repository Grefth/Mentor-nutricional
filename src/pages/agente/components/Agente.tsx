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
            alert("Configura primero el teléfono del cliente en el panel principal.");
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
        <div className="antialiased overflow-hidden h-screen flex">
            <aside className="sidebar w-80 flex flex-col h-full shrink-0">
                <div className="p-6 pb-2">
                    <h1 className="text-xl font-bold text-[#111827] leading-tight">Chatbot</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Basado en tus datos</p>
                </div>
                <button
                    className="flex items-center gap-4 px-4 py-3 text-[var(--text-muted)] hover:bg-white/50 rounded-xl font-medium transition-all"
                    type="button"
                    onClick={() => navigate("/")}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Regresar
                </button>
            </aside>

            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-[#FFFFFF]">
                <header className="shrink-0 p-6 pb-2 z-10">
                    <div className="header-banner relative w-full h-40 rounded-2xl overflow-hidden shadow-md">
                        <div
                            className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSMFI0HYCHsImwmTUzwKs6NhvIKeJ4fEnc5CaSHUqygjlF2xMqbtOIQAoVXC_VY5o3fibXg4RtYhTAmb-hC3PjiLG6a5PpDI_0iC3N-uywYs4d4WUD6j9RENC2wz8j7bYLVx-JjnB_PPmHB2urXEDDItt3DQIL1w0T3bPSuKgg9-o4wkKanf9-0GiMUnG7UcPd6NSpVTozi4m_8lRX6aHQ4Z1M9V80Q1kiewt2PqlWiLpbGbaoiDe3cNAmf5Ki_zAG7rBynEMd1PPI')",
                            }}
                        />
                        <div className="absolute bottom-0 left-0 p-6">
                            <h2 className="text-white text-3xl font-bold tracking-tight mb-1">Asistente nutricional</h2>
                            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00C853]" />
                                Conectado a tu historial
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" id="chat-container">
                    <div className="flex justify-center">
                        <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full uppercase tracking-wider">
                            Hoy
                        </span>
                    </div>

                    {messages.map((m) =>
                        m.role === "assistant" ? (
                            <div key={m.id} className="flex items-start gap-3 max-w-3xl">
                                <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-[var(--ai-bubble-border)]">
                                    <span className="material-symbols-outlined text-[#2E7D32]">smart_toy</span>
                                </div>
                                <div className="flex flex-col gap-1 items-start min-w-0">
                                    <span className="text-xs text-[#6B7280] font-bold ml-1">Nutri-AI</span>
                                    <div className="ai-message p-4 rounded-2xl rounded-tl-none shadow-sm leading-relaxed break-words">
                                        <ChatMarkdown content={m.content} variant="assistant" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={m.id} className="flex items-start gap-3 max-w-3xl ml-auto justify-end">
                                <div className="flex flex-col gap-1 items-end min-w-0 max-w-[85%]">
                                    <span className="text-xs text-[#6B7280] font-bold mr-1">Tú</span>
                                    <div className="user-message p-4 rounded-2xl rounded-tr-none shadow-sm leading-relaxed break-words [&_p]:font-medium">
                                        <ChatMarkdown content={m.content} variant="user" />
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#E5E7EB] shrink-0 flex items-center justify-center border border-[var(--sidebar-border)]">
                                    <span className="material-symbols-outlined text-[#4B5563] text-[22px]">person</span>
                                </div>
                            </div>
                        )
                    )}

                    {loading ? (
                        <div className="flex items-start gap-3 max-w-3xl">
                            <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-[var(--ai-bubble-border)]">
                                <span className="material-symbols-outlined text-[#2E7D32] animate-pulse">smart_toy</span>
                            </div>
                            <div className="flex flex-col gap-1 items-start">
                                <span className="text-xs text-[#6B7280] font-bold ml-1">Nutri-AI</span>
                                <div className="ai-message p-4 rounded-2xl rounded-tl-none shadow-sm text-[#6B7280] text-sm">
                                    Pensando…
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div ref={chatEndRef} />
                </div>

                <div className="p-6 pt-2">
                    <div className="input-container rounded-xl shadow-sm flex items-end p-2 gap-2">
                        <button
                            type="button"
                            className="p-2.5 text-[#9CA3AF] hover:text-[#2E7D32] transition-colors rounded-lg hover:bg-[#F9FAFB] self-end mb-0.5"
                            aria-label="Adjuntar (próximamente)"
                            disabled
                        >
                            <span className="material-symbols-outlined text-[24px]">add_circle</span>
                        </button>
                        <div className="flex-1 py-2">
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onKeyDown}
                                disabled={loading}
                                rows={1}
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[#111827] placeholder-[#9CA3AF] resize-none max-h-32"
                                placeholder="Escribe tu pregunta sobre tu alimentación…"
                            />
                        </div>
                        <div className="self-end mb-0.5">
                            <button
                                type="button"
                                onClick={() => void sendMessage()}
                                disabled={loading || !draft.trim()}
                                className="send-button font-bold rounded-lg px-5 py-2.5 transition-opacity hover:opacity-90 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>Enviar</span>
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-[#9CA3AF] mt-3">
                        La IA puede equivocarse. Verifica información médica importante con tu nutricionista.
                    </p>
                </div>
            </main>
        </div>
    );
};
