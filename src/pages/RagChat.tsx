import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Trash2,
  Database,
  FileText,
  Plus,
  X,
  Upload,
  Tag,
} from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { useRagChat } from "@/hooks/useRagChat";

export function RagChat() {
  const {
    messages,
    loading,
    stats,
    sendMessage,
    clearMessages,
    ingesting,
    ingestContent,
  } = useRagChat();
  const [input, setInput] = useState("");
  const [showIngest, setShowIngest] = useState(false);
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestBody, setIngestBody] = useState("");
  const [ingestTags, setIngestTags] = useState("");
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleIngest = async () => {
    if (!ingestTitle.trim() || !ingestBody.trim() || ingesting) return;
    try {
      const result = await ingestContent(
        ingestTitle.trim(),
        ingestBody.trim(),
        ingestTags.trim() || undefined,
      );
      if (result) setIngestSuccess(result.message);
      setIngestTitle("");
      setIngestBody("");
      setIngestTags("");
      setTimeout(() => setIngestSuccess(null), 4000);
    } catch {
      // error is set in hook
    }
  };

  return (
    <PageContainer
      title="Multimodal RAG"
      description="Busca inteligente com Gemini Embeddings + Pinecone"
      maxWidth="4xl"
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIngest((v) => !v)}
            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border transition ${
              showIngest
                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                : "bg-bg-tertiary border-border-default text-text-muted hover:text-white"
            }`}
          >
            {showIngest ? (
              <X className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            {showIngest ? "Fechar" : "Inserir"}
          </button>
          {stats && (
            <span className="text-xs text-text-muted flex items-center gap-1.5 bg-bg-tertiary px-3 py-1.5 rounded-full">
              <Database className="w-3 h-3" />
              {stats.totalVectors} vectors
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-xs text-text-muted hover:text-red-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      }
    >
      {/* Ingest Panel */}
      {showIngest && (
        <div className="mb-4 bg-bg-tertiary border border-border-default rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            Inserir conteudo no RAG
          </h3>
          <input
            type="text"
            value={ingestTitle}
            onChange={(e) => setIngestTitle(e.target.value)}
            placeholder="Titulo (ex: Gotchas do n8n v2)"
            className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
          />
          <textarea
            value={ingestBody}
            onChange={(e) => setIngestBody(e.target.value)}
            placeholder="Cole o conteudo aqui... (texto, notas, documentacao, etc.)"
            rows={6}
            className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 resize-y"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                value={ingestTags}
                onChange={(e) => setIngestTags(e.target.value)}
                placeholder="Tags (opcional, ex: n8n, gotcha)"
                className="flex-1 bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={handleIngest}
              disabled={ingesting || !ingestTitle.trim() || !ingestBody.trim()}
              className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center gap-2"
            >
              {ingesting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingerindo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Inserir
                </>
              )}
            </button>
          </div>
          {ingestSuccess && (
            <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {ingestSuccess}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      <div
        className={`flex flex-col ${showIngest ? "h-[calc(100vh-480px)]" : "h-[calc(100vh-220px)]"}`}
      >
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Busca Multimodal
              </h2>
              <p className="text-text-muted text-sm max-w-md mx-auto">
                Pergunte sobre qualquer conteudo no banco de dados. Texto,
                imagens, PDFs, videos e audios — tudo em um unico espaco
                vetorial.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Quais gotchas do n8n?",
                  "Como funciona o FUU?",
                  "Qual o fluxo de agendamento?",
                  "O que mudou no cost tracking?",
                ].map((q) => (
                  <button
                    key={q}
                    disabled={loading}
                    onClick={() => {
                      setInput(q);
                      sendMessage(q);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-bg-tertiary text-text-muted hover:text-white hover:bg-bg-secondary border border-border-default transition disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="bg-indigo-600/20 border border-indigo-500/20 rounded-xl px-4 py-3 max-w-lg">
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-2xl space-y-3">
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <details className="group">
                      <summary className="text-xs text-text-muted cursor-pointer hover:text-gray-300 select-none">
                        {msg.sources.length} fontes encontradas
                      </summary>
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((s, j) => {
                          const scoreColor =
                            s.score > 75
                              ? "bg-green-500"
                              : s.score > 50
                                ? "bg-yellow-500"
                                : "bg-red-500";
                          return (
                            <div
                              key={j}
                              className="bg-bg-tertiary border border-border-default rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {s.metadata.source_file || "unknown"}
                                </span>
                                <span className="text-xs text-text-muted">
                                  {s.score}%
                                </span>
                              </div>
                              <div className="w-full h-1 rounded-full bg-bg-secondary mb-2">
                                <div
                                  className={`h-1 rounded-full ${scoreColor} transition-all duration-500`}
                                  style={{ width: `${s.score}%` }}
                                />
                              </div>
                              <p className="text-xs text-text-muted">
                                {s.metadata.content_type || ""}
                                {s.metadata.page_number
                                  ? ` | pg ${s.metadata.page_number}`
                                  : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                  style={{ animationDelay: "0.3s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
                  style={{ animationDelay: "0.6s" }}
                />
              </div>
              Buscando no banco vetorial...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-bg-tertiary border border-border-default rounded-xl p-3 mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pergunte qualquer coisa..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-sm px-2"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
