import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, Trash2, MoreHorizontal } from "lucide-react";
import { useBoards } from "../hooks/useBoards";
import { BOARD_COLORS } from "../types/board";
import type { Board } from "../types/board";

// ── New Board Dialog ──────────────────────────────────────────────────────────

interface NewBoardDialogProps {
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => Promise<void>;
}

function NewBoardDialog({ onClose, onCreate }: NewBoardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim(), description.trim(), color);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-zinc-100">Novo Board</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Nome
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projeto Alpha"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Descricao (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descricao do board..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Cor
            </label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#fff" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {loading ? "Criando..." : "Criar Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Board Card ────────────────────────────────────────────────────────────────

interface BoardCardProps {
  board: Board;
  onDelete: (id: string) => void;
}

function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const color = board.color ?? "#579BFC";

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40"
      onClick={() => navigate(`/boards/${board.slug}`)}
    >
      {/* Color accent top bar */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl leading-none" aria-hidden>
            {board.icon ?? "📋"}
          </span>
          <h3 className="truncate text-sm font-semibold text-zinc-100">
            {board.name}
          </h3>
        </div>

        {/* Context menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="rounded p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-7 z-20 w-36 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(board.id);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 size={13} />
                  Deletar board
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {board.description && (
        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
          {board.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-600">
          {new Date(board.created_at).toLocaleDateString("pt-BR")}
        </span>
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="h-1 w-full rounded-t-xl bg-zinc-800 -mt-5 mb-5" />
      <div className="flex gap-2 items-center">
        <div className="h-6 w-6 rounded bg-zinc-800" />
        <div className="h-4 w-32 rounded bg-zinc-800" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-zinc-800" />
      <div className="mt-1.5 h-3 w-2/3 rounded bg-zinc-800" />
      <div className="mt-4 h-3 w-20 rounded bg-zinc-800" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
        <LayoutGrid size={28} className="text-zinc-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-zinc-200">
        Nenhum board criado ainda
      </h3>
      <p className="mb-6 max-w-xs text-sm text-zinc-500">
        Crie seu primeiro board para organizar tarefas, projetos e equipes como
        no Monday.com.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        <Plus size={15} />
        Criar primeiro board
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function BoardsList() {
  const { boards, loading, error, createBoard, deleteBoard } = useBoards();
  const [showDialog, setShowDialog] = useState(false);

  const handleCreate = async (
    name: string,
    description: string,
    color: string,
  ) => {
    const board = await createBoard({ name, description, color });
    if (board) setShowDialog(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este board? Esta acao nao pode ser desfeita."))
      return;
    await deleteBoard(id);
  };

  return (
    <div className="min-h-screen bg-[#07070f] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Boards</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie projetos e tarefas com visao estilo Monday.com
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus size={15} />
          Novo Board
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <EmptyState onCreate={() => setShowDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showDialog && (
        <NewBoardDialog
          onClose={() => setShowDialog(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
