"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "22px 24px",
        boxShadow: "0 1px 6px rgba(0,0,0,.06)",
        fontSize: 14,
        color: "#334155",
        lineHeight: 1.9,
      }}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "20px 0 8px 0" }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "18px 0 6px 0" }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#1E293B", margin: "14px 0 4px 0" }}>{children}</h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: "6px 0", lineHeight: 1.85 }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: 20, margin: "6px 0" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: 20, margin: "6px 0" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "3px 0", lineHeight: 1.8 }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 800, color: "#0F172A" }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: "italic", color: "#475569" }}>{children}</em>
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "16px 0" }} />
          ),
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: "3px solid #16A34A",
              paddingLeft: 14,
              margin: "10px 0",
              color: "#64748B",
            }}>
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code style={{
              background: "#F1F5F9",
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 12.5,
              fontFamily: "monospace",
            }}>
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "10px 0" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ padding: "8px 12px", background: "#F8FAFC", borderBottom: "2px solid #E2E8F0", textAlign: "left", fontWeight: 700 }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ padding: "7px 12px", borderBottom: "1px solid #F1F5F9" }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
