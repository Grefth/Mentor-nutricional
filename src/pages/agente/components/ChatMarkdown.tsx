import { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Variant = "assistant" | "user";

function markdownComponents(variant: Variant): Components {
    const linkClass =
        variant === "assistant"
            ? "text-[#2E7D32] underline underline-offset-2 hover:opacity-90 break-all"
            : "text-white underline underline-offset-2 hover:opacity-90 break-all";
    const inlineCode =
        variant === "assistant"
            ? "rounded bg-[#E8F5E9] px-1.5 py-0.5 text-[0.875em] font-mono text-[#1B5E20]"
            : "rounded bg-white/25 px-1.5 py-0.5 text-[0.875em] font-mono";
    const preBox =
        variant === "assistant"
            ? "my-2 overflow-x-auto rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] p-3 text-sm text-[#111827]"
            : "my-2 overflow-x-auto rounded-lg border border-white/25 bg-black/15 p-3 text-sm";

    return {
        pre: ({ children }) => <pre className={preBox}>{children}</pre>,
        h1: ({ children }) => (
            <h1 className="mb-2 mt-3 text-xl font-bold first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="mb-2 mt-3 text-lg font-bold first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="mb-1.5 mt-2 text-base font-bold first:mt-0">{children}</h3>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0 marker:text-current">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0 marker:text-current">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
            <blockquote
                className={
                    variant === "assistant"
                        ? "my-2 border-l-4 border-[#2E7D32]/40 pl-3 text-[#374151] italic"
                        : "my-2 border-l-4 border-white/50 pl-3 italic text-white/95"
                }
            >
                {children}
            </blockquote>
        ),
        hr: () => (
            <hr
                className={
                    variant === "assistant" ? "my-3 border-[#E5E7EB]" : "my-3 border-white/30"
                }
            />
        ),
        a: ({ href, children }) => (
            <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => (
            <del className={variant === "assistant" ? "text-[#6B7280]" : "text-white/70"}>{children}</del>
        ),
        code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className ?? "");
            if (match) {
                return (
                    <code
                        className={`${className ?? ""} block font-mono text-[0.8125rem] leading-relaxed`}
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            return (
                <code className={inlineCode} {...props}>
                    {children}
                </code>
            );
        },
        table: ({ children }) => (
            <div className="my-2 max-w-full overflow-x-auto">
                <table
                    className={
                        variant === "assistant"
                            ? "min-w-full border-collapse border border-[#E5E7EB] text-sm"
                            : "min-w-full border-collapse border border-white/30 text-sm"
                    }
                >
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }) => <thead className={variant === "assistant" ? "bg-[#F9FAFB]" : "bg-white/10"}>{children}</thead>,
        th: ({ children }) => (
            <th
                className={
                    variant === "assistant"
                        ? "border border-[#E5E7EB] px-2 py-1.5 text-left font-semibold"
                        : "border border-white/30 px-2 py-1.5 text-left font-semibold"
                }
            >
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td
                className={
                    variant === "assistant"
                        ? "border border-[#E5E7EB] px-2 py-1.5 align-top"
                        : "border border-white/30 px-2 py-1.5 align-top"
                }
            >
                {children}
            </td>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
    };
}

type ChatMarkdownProps = {
    content: string;
    variant?: Variant;
};

export function ChatMarkdown({ content, variant = "assistant" }: ChatMarkdownProps) {
    const components = useMemo(() => markdownComponents(variant), [variant]);

    return (
        <div className="min-w-0 break-words text-left">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
