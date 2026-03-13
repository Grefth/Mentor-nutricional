import {useNavigate} from "react-router-dom";

export const Agente = () => {
    const navigate = useNavigate();

    return (
        <div className="antialiased overflow-hidden h-screen flex">
            <aside className="sidebar w-80 flex flex-col h-full shrink-0">
                <div className="p-6 pb-2">
                    <h1 className="text-xl font-bold text-[#111827] leading-tight">
                        Chatbot
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Chat Activo</p>
                </div>
                <button className="flex items-center gap-4 px-4 py-3 text-[var(--text-muted)] hover:bg-white/50 rounded-xl font-medium transition-all"
                        onClick={() => {navigate("/")}} >
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
                                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDSMFI0HYCHsImwmTUzwKs6NhvIKeJ4fEnc5CaSHUqygjlF2xMqbtOIQAoVXC_VY5o3fibXg4RtYhTAmb-hC3PjiLG6a5PpDI_0iC3N-uywYs4d4WUD6j9RENC2wz8j7bYLVx-JjnB_PPmHB2urXEDDItt3DQIL1w0T3bPSuKgg9-o4wkKanf9-0GiMUnG7UcPd6NSpVTozi4m_8lRX6aHQ4Z1M9V80Q1kiewt2PqlWiLpbGbaoiDe3cNAmf5Ki_zAG7rBynEMd1PPI')",
                            }}
                        ></div>
                        <div className="absolute bottom-0 left-0 p-6">
                            <h2 className="text-white text-3xl font-bold tracking-tight mb-1">
                                AI Health Assistant
                            </h2>
                            <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00C853]"></span>
                                Nutrition Expert Online
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" id="chat-container">
                    <div className="flex justify-center">
            <span
                className="text-xs font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full uppercase tracking-wider">
              Today
            </span>
                    </div>

                    <div className="flex items-start gap-3 max-w-3xl">
                        <div
                            className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-[var(--ai-bubble-border)]">
              <span className="material-symbols-outlined text-[#2E7D32]">
                smart_toy
              </span>
                        </div>
                        <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-[#6B7280] font-bold ml-1">
                Nutri-AI
              </span>
                            <div className="ai-message p-4 rounded-2xl rounded-tl-none shadow-sm leading-relaxed">
                                <p>
                                    Hello! Based on your logs, you've been consistent with your
                                    protein intake. How are you feeling about the new meal plan?
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 max-w-3xl ml-auto justify-end">
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-xs text-[#6B7280] font-bold mr-1">You</span>
                            <div className="user-message p-4 rounded-2xl rounded-tr-none shadow-sm leading-relaxed">
                                <p className="font-medium">
                                    I'm feeling good, but lunch is a bit heavy. Can we adjust?
                                </p>
                            </div>
                        </div>
                        <div
                            className="w-9 h-9 rounded-full bg-[#E5E7EB] shrink-0 overflow-hidden border border-[var(--sidebar-border)]"
                            style={{
                                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_xKOBxiltsTBkY-96_JQb0lyue3MNUBwODs-g_CbVdHe8aSV4fpb4Lv1DJrfz4toyH9Jj0NtVPZwGGjOjxRvayt_iGKxCz86XIJCfJb6Xy3zDIdbtETIDUpzItlGggf9zAanUFTd0HbWXwuHvSfXN-bpHcg8Mssp9ZzVD5QtL-iwE6zuk_8P3I4HEq_J5Abok6B0rXbFrA3DOsrkvzB3cSq-dAOsXJMCa9bvPf99AJE5aCCN5cOkIGNBLiqb7__Wenw3vNSbYM489')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        ></div>
                    </div>

                    <div className="flex items-start gap-3 max-w-3xl">
                        <div
                            className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0 border border-[var(--ai-bubble-border)]">
              <span className="material-symbols-outlined text-[#2E7D32]">
                smart_toy
              </span>
                        </div>
                        <div className="flex flex-col gap-1 items-start">
              <span className="text-xs text-[#6B7280] font-bold ml-1">
                Nutri-AI
              </span>
                            <div className="ai-message p-4 rounded-2xl rounded-tl-none shadow-sm leading-relaxed">
                                <p>
                                    Absolutely. We can make the lunch lighter. Would you prefer
                                    swapping the quinoa bowl for a salad, or perhaps reducing the
                                    portion size?
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 max-w-3xl ml-auto justify-end">
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-xs text-[#6B7280] font-bold mr-1">You</span>
                            <div className="user-message p-4 rounded-2xl rounded-tr-none shadow-sm leading-relaxed">
                                <p className="font-medium">
                                    A salad sounds great. Maybe something with grilled chicken?
                                </p>
                            </div>
                        </div>
                        <div
                            className="w-9 h-9 rounded-full bg-[#E5E7EB] shrink-0 overflow-hidden border border-[var(--sidebar-border)]"
                            style={{
                                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2wHMpNQPaimYBOdDnHOow2jLuKG0qAqEh8N050wkyzoPwuYJEbZ6o2RjtPjq-AnVYSYgdhsIibV3fsn7G66QC_bHnfqMjN4tdeZghxPyfzPEy-ixyHnN1OsNu2gYxyxPb7chkfv95Eo9btJyXWc5-EwyIysmfYufrjRpzjPxR0UxaLvAs5AZt095Qr40YBOolZzIAKOI5QhTeRG3YDL2BiC5oNdCJXhTOdA5vHNOMYxl-5Nw76drw6J-87ZSs9sY26RbAbNLTE_1u')",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        ></div>
                    </div>
                </div>

                <div className="p-6 pt-2">
                    <div className="input-container rounded-xl shadow-sm flex items-end p-2 gap-2">
                        <button
                            className="p-2.5 text-[#9CA3AF] hover:text-[#2E7D32] transition-colors rounded-lg hover:bg-[#F9FAFB] self-end mb-0.5">
              <span className="material-symbols-outlined text-[24px]">
                add_circle
              </span>
                        </button>
                        <div className="flex-1 py-2">
              <textarea
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[#111827] placeholder-[#9CA3AF] resize-none max-h-32"
                  placeholder="Type your message here..."
              ></textarea>
                        </div>
                        <div className="flex items-center gap-1 self-end mb-0.5">
                            <button
                                className="p-2.5 text-[#9CA3AF] hover:text-[#2E7D32] transition-colors rounded-lg hover:bg-[#F9FAFB]">
                <span className="material-symbols-outlined text-[20px]">
                  mic
                </span>
                            </button>
                            <button
                                className="send-button font-bold rounded-lg px-5 py-2.5 transition-opacity hover:opacity-90 flex items-center gap-2">
                                <span>Send</span>
                                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-[#9CA3AF] mt-3">
                        AI can make mistakes. Please verify important medical information
                        with your nutritionist.
                    </p>
                </div>
            </main>
        </div>
    );
};