import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  Check,
  LayoutGrid,
  Kanban,
  Calendar,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useBoardData } from "../hooks/useBoardData";
import {
  DEFAULT_STATUS_LABELS,
  getCellRawValue,
  BOARD_COLORS,
} from "../types/board";
import type {
  BoardItem,
  BoardColumn,
  BoardGroup,
  ColumnType,
  StatusLabel,
} from "../types/board";

// ── Column type labels ────────────────────────────────────────────────────────

const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Texto",
  number: "Numero",
  status: "Status",
  date: "Data",
  person: "Pessoa",
  dropdown: "Lista",
  checkbox: "Checkbox",
};

// ── CellRenderer ─────────────────────────────────────────────────────────────

interface CellRendererProps {
  item: BoardItem;
  column: BoardColumn;
  onUpdate: (value: {
    value_text?: string | null;
    value_number?: number | null;
    value_date?: string | null;
    value_json?: unknown | null;
  }) => void;
}

function CellRenderer({ item, column, onUpdate }: CellRendererProps) {
  const raw = getCellRawValue(item, column.id);
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const val = item.values?.find((v) => v.column_id === column.id);

  switch (column.column_type) {
    case "text":
      return editing ? (
        <input
          autoFocus
          defaultValue={typeof raw === "string" ? raw : ""}
          className="w-full bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500/60 rounded"
          onBlur={(e) => {
            onUpdate({ value_text: e.target.value || null });
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      ) : (
        <div
          className="w-full cursor-text truncate px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800/60 rounded"
          onClick={() => setEditing(true)}
        >
          {raw ?? <span className="text-zinc-600">—</span>}
        </div>
      );

    case "number":
      return editing ? (
        <input
          autoFocus
          type="number"
          defaultValue={typeof raw === "number" ? raw : ""}
          className="w-full bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500/60 rounded"
          onBlur={(e) => {
            const n = parseFloat(e.target.value);
            onUpdate({ value_number: isNaN(n) ? null : n });
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      ) : (
        <div
          className="w-full cursor-text truncate px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800/60 rounded"
          onClick={() => setEditing(true)}
        >
          {raw !== null ? raw : <span className="text-zinc-600">—</span>}
        </div>
      );

    case "status": {
      const labels: StatusLabel[] =
        column.settings?.labels ?? DEFAULT_STATUS_LABELS;
      const currentId =
        typeof val?.value_json === "string" ? val.value_json : null;
      const current = labels.find((l) => l.id === currentId);

      return (
        <div className="relative flex justify-center">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="w-full rounded px-2 py-0.5 text-center text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: current?.color ?? "#3f3f46",
              color: current ? "#fff" : "#71717a",
            }}
          >
            {current?.label ?? "—"}
          </button>
          {statusOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setStatusOpen(false)}
              />
              <div className="absolute top-7 left-0 z-30 w-40 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onUpdate({ value_json: l.id });
                      setStatusOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-800"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-zinc-200">{l.label}</span>
                    {l.id === currentId && (
                      <Check size={11} className="ml-auto text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    case "date":
      return (
        <input
          type="date"
          value={
            typeof val?.value_date === "string"
              ? val.value_date.split("T")[0]
              : ""
          }
          onChange={(e) => onUpdate({ value_date: e.target.value || null })}
          className="w-full bg-transparent px-2 py-1 text-xs text-zinc-300 outline-none focus:bg-zinc-800 rounded cursor-pointer"
        />
      );

    case "checkbox": {
      const checked =
        val?.value_json === true ||
        val?.value_json === "true" ||
        val?.value_number === 1;
      return (
        <div className="flex justify-center">
          <button
            onClick={() => onUpdate({ value_json: !checked })}
            className={`h-4 w-4 rounded border transition-colors ${
              checked
                ? "border-green-500 bg-green-500"
                : "border-zinc-600 bg-transparent hover:border-zinc-400"
            }`}
          >
            {checked && <Check size={11} className="text-white m-auto block" />}
          </button>
        </div>
      );
    }

    case "dropdown": {
      const options = column.settings?.options ?? [];
      const currentVal =
        typeof val?.value_json === "string" ? val.value_json : "";
      return (
        <select
          value={currentVal}
          onChange={(e) => onUpdate({ value_json: e.target.value || null })}
          className="w-full bg-transparent px-2 py-1 text-xs text-zinc-300 outline-none cursor-pointer"
        >
          <option value="">—</option>
          {options.map((opt: { id: string; label: string }) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    case "person":
      return editing ? (
        <input
          autoFocus
          defaultValue={typeof raw === "string" ? raw : ""}
          placeholder="Nome da pessoa..."
          className="w-full bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500/60 rounded"
          onBlur={(e) => {
            onUpdate({ value_text: e.target.value || null });
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      ) : (
        <div
          className="flex cursor-pointer items-center gap-1.5 px-2 py-1 hover:bg-zinc-800/60 rounded"
          onClick={() => setEditing(true)}
        >
          {raw ? (
            <>
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white uppercase">
                {String(raw).charAt(0)}
              </div>
              <span className="truncate text-xs text-zinc-300">{raw}</span>
            </>
          ) : (
            <span className="text-xs text-zinc-600">—</span>
          )}
        </div>
      );

    default:
      return null;
  }
}

// ── Sortable Item Row ─────────────────────────────────────────────────────────

interface SortableItemRowProps {
  item: BoardItem;
  columns: BoardColumn[];
  groupColor: string;
  onUpdateName: (name: string) => void;
  onUpdateValue: (
    columnId: string,
    value: {
      value_text?: string | null;
      value_number?: number | null;
      value_date?: string | null;
      value_json?: unknown | null;
    },
  ) => void;
  onDelete: () => void;
}

function SortableItemRow({
  item,
  columns,
  groupColor,
  onUpdateName,
  onUpdateValue,
  onDelete,
}: SortableItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(item.name);
  const [hovered, setHovered] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameVal(item.name);
  }, [item.name]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center border-b border-zinc-800/60 hover:bg-zinc-800/20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab px-1 py-2 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </div>

      {/* Color bar */}
      <div
        className="w-1 flex-shrink-0 self-stretch"
        style={{ backgroundColor: groupColor }}
      />

      {/* Item name — first column */}
      <div className="flex min-w-[200px] max-w-[260px] flex-shrink-0 items-center border-r border-zinc-800 px-2 py-1.5">
        {editingName ? (
          <input
            ref={nameInputRef}
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => {
              onUpdateName(nameVal.trim() || item.name);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape")
                nameInputRef.current?.blur();
            }}
            className="w-full bg-transparent text-xs text-zinc-100 outline-none"
          />
        ) : (
          <span
            className="cursor-text truncate text-xs text-zinc-200 hover:text-zinc-100"
            onClick={() => setEditingName(true)}
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Dynamic columns */}
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-1 min-w-[120px] border-r border-zinc-800 py-1 px-1"
          style={{ width: col.width ?? 140 }}
        >
          <CellRenderer
            item={item}
            column={col}
            onUpdate={(value) => onUpdateValue(col.id, value)}
          />
        </div>
      ))}

      {/* Delete button */}
      {hovered && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 px-2 py-1.5 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ── Add Item Row ──────────────────────────────────────────────────────────────

interface AddItemRowProps {
  onAdd: (name: string) => void;
  columnsCount: number;
}

function AddItemRow({ onAdd, columnsCount }: AddItemRowProps) {
  const [active, setActive] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
    setActive(false);
  };

  if (!active) {
    return (
      <button
        onClick={() => {
          setActive(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center gap-1.5 border-b border-zinc-800/40 px-4 py-1.5 text-xs text-zinc-600 hover:bg-zinc-800/20 hover:text-zinc-400 transition-colors"
      >
        <Plus size={13} />
        Adicionar item
      </button>
    );
  }

  return (
    <div className="flex items-center border-b border-zinc-800 bg-zinc-800/20 px-4 py-1.5 gap-2">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do item..."
        className="flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder-zinc-600"
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setName("");
            setActive(false);
          }
        }}
        onBlur={commit}
      />
      <span className="text-[10px] text-zinc-600">Enter para salvar</span>
    </div>
  );
}

// ── Group Section ─────────────────────────────────────────────────────────────

interface GroupSectionProps {
  group: BoardGroup;
  items: BoardItem[];
  columns: BoardColumn[];
  boardId: string;
  onAddItem: (name: string) => void;
  onUpdateItemName: (itemId: string, name: string) => void;
  onUpdateItemValue: (
    itemId: string,
    columnId: string,
    value: {
      value_text?: string | null;
      value_number?: number | null;
      value_date?: string | null;
      value_json?: unknown | null;
    },
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleCollapsed: () => void;
  onReorder: (orderedIds: string[]) => void;
}

function GroupSection({
  group,
  items,
  columns,
  onAddItem,
  onUpdateItemName,
  onUpdateItemValue,
  onDeleteItem,
  onToggleCollapsed,
  onReorder,
}: GroupSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const reordered = arrayMove(items, oldIdx, newIdx);
      onReorder(reordered.map((i) => i.id));
    },
    [items, onReorder],
  );

  return (
    <div className="mb-4">
      {/* Group header */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          onClick={onToggleCollapsed}
          className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <div
            className="flex h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          {group.collapsed ? (
            <ChevronRight size={14} className="text-zinc-500" />
          ) : (
            <ChevronDown size={14} className="text-zinc-500" />
          )}
          <span className="text-xs font-semibold tracking-wide">
            {group.name}
          </span>
          <span className="text-[10px] text-zinc-600">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </button>
      </div>

      {/* Column headers (only first group or always) */}
      {!group.collapsed && (
        <>
          <div className="flex items-center border-y border-zinc-800 bg-zinc-900/60">
            {/* spacers */}
            <div className="w-6 flex-shrink-0" /> {/* drag handle */}
            <div className="w-1 flex-shrink-0" /> {/* color bar */}
            <div className="min-w-[200px] max-w-[260px] flex-shrink-0 border-r border-zinc-800 px-3 py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Item
              </span>
            </div>
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex-1 min-w-[120px] border-r border-zinc-800 px-3 py-1.5"
                style={{ width: col.width ?? 140 }}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {col.name}
                </span>
              </div>
            ))}
          </div>

          {/* Items */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  columns={columns}
                  groupColor={group.color}
                  onUpdateName={(name) => onUpdateItemName(item.id, name)}
                  onUpdateValue={(colId, value) =>
                    onUpdateItemValue(item.id, colId, value)
                  }
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <AddItemRow onAdd={onAddItem} columnsCount={columns.length} />
        </>
      )}
    </div>
  );
}

// ── Add Column Dialog ─────────────────────────────────────────────────────────

interface AddColumnDialogProps {
  onClose: () => void;
  onAdd: (name: string, type: ColumnType) => Promise<void>;
}

function AddColumnDialog({ onClose, onAdd }: AddColumnDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), type);
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-80 rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Nova Coluna</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Responsavel"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ColumnType)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            >
              {(
                Object.entries(COLUMN_TYPE_LABELS) as [ColumnType, string][]
              ).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Group Dialog ──────────────────────────────────────────────────────────

interface AddGroupDialogProps {
  onClose: () => void;
  onAdd: (name: string, color: string) => Promise<void>;
}

function AddGroupDialog({ onClose, onAdd }: AddGroupDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), color);
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-80 rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Novo Grupo</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Em andamento"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#fff" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 rounded-lg py-2 text-xs font-medium text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: color }}
            >
              {loading ? "Criando..." : "Criar Grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Coming Soon Placeholder ───────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-3 text-4xl">🚧</div>
      <p className="text-sm font-medium text-zinc-400">{label} — Em breve</p>
      <p className="mt-1 text-xs text-zinc-600">
        Esta visao estara disponivel em proximas versoes.
      </p>
    </div>
  );
}

// ── BoardTableView ────────────────────────────────────────────────────────────

interface BoardTableViewProps {
  boardId: string;
  columns: BoardColumn[];
  groups: BoardGroup[];
  itemsByGroup: Record<string, BoardItem[]>;
  onAddGroup: (name: string, color: string) => Promise<void>;
  onAddItem: (groupId: string, name: string) => void;
  onUpdateItemName: (itemId: string, name: string) => void;
  onUpdateItemValue: (
    itemId: string,
    columnId: string,
    value: {
      value_text?: string | null;
      value_number?: number | null;
      value_date?: string | null;
      value_json?: unknown | null;
    },
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onReorderItems: (groupId: string, orderedIds: string[]) => void;
  onAddColumn: (name: string, type: ColumnType) => Promise<void>;
}

function BoardTableView({
  boardId,
  columns,
  groups,
  itemsByGroup,
  onAddGroup,
  onAddItem,
  onUpdateItemName,
  onUpdateItemValue,
  onDeleteItem,
  onToggleGroupCollapsed,
  onReorderItems,
  onAddColumn,
}: BoardTableViewProps) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);

  return (
    <div className="overflow-x-auto">
      {/* Column header bar with + button */}
      <div className="flex items-center justify-end border-b border-zinc-800 pb-2 mb-2 px-2 gap-2">
        <button
          onClick={() => setShowAddColumn(true)}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <Plus size={12} /> Coluna
        </button>
        <button
          onClick={() => setShowAddGroup(true)}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <Plus size={12} /> Grupo
        </button>
      </div>

      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          items={itemsByGroup[group.id] ?? []}
          columns={columns}
          boardId={boardId}
          onAddItem={(name) => onAddItem(group.id, name)}
          onUpdateItemName={onUpdateItemName}
          onUpdateItemValue={onUpdateItemValue}
          onDeleteItem={onDeleteItem}
          onToggleCollapsed={() => onToggleGroupCollapsed(group.id)}
          onReorder={(ids) => onReorderItems(group.id, ids)}
        />
      ))}

      {groups.length === 0 && (
        <div className="py-16 text-center text-sm text-zinc-600">
          Nenhum grupo. Clique em &quot;+ Grupo&quot; para comecar.
        </div>
      )}

      {showAddColumn && (
        <AddColumnDialog
          onClose={() => setShowAddColumn(false)}
          onAdd={async (name, type) => onAddColumn(name, type)}
        />
      )}
      {showAddGroup && (
        <AddGroupDialog
          onClose={() => setShowAddGroup(false)}
          onAdd={async (name, color) => onAddGroup(name, color)}
        />
      )}
    </div>
  );
}

// ── BoardView (Page) ──────────────────────────────────────────────────────────

type ViewTab = "table" | "kanban" | "calendar";

export function BoardView() {
  const { slug } = useParams<{ slug: string }>();
  const {
    boardData,
    loading,
    error,
    fetchBoardBySlug,
    addGroup,
    addItem,
    updateItemName,
    updateItemValue,
    moveItem,
    reorderItems,
    deleteItem,
    addColumn,
    toggleGroupCollapsed,
  } = useBoardData();

  const [activeView, setActiveView] = useState<ViewTab>("table");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug) fetchBoardBySlug(slug);
  }, [slug, fetchBoardBySlug]);

  useEffect(() => {
    if (boardData?.board.name) setTitleVal(boardData.board.name);
  }, [boardData?.board.name]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddGroup = useCallback(
    async (name: string, color: string) => {
      if (!boardData) return;
      await addGroup(boardData.board.id, name, color);
    },
    [boardData, addGroup],
  );

  const handleAddItem = useCallback(
    (groupId: string, name: string) => {
      if (!boardData) return;
      addItem(boardData.board.id, groupId, name);
    },
    [boardData, addItem],
  );

  const handleAddColumn = useCallback(
    async (name: string, type: ColumnType) => {
      if (!boardData) return;
      await addColumn(boardData.board.id, name, type);
    },
    [boardData, addColumn],
  );

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !boardData) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-red-400">
          {error ?? "Board nao encontrado."}
        </p>
      </div>
    );
  }

  const { board, columns, groups, itemsByGroup } = boardData;

  const VIEW_TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "table", label: "Tabela", icon: <LayoutGrid size={14} /> },
    { id: "kanban", label: "Kanban", icon: <Kanban size={14} /> },
    { id: "calendar", label: "Calendario", icon: <Calendar size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* ── Board Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-[#07070f] px-6 py-4">
        {/* Title */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">{board.icon ?? "📋"}</span>
          {editingTitle ? (
            <input
              ref={titleRef}
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={() => {
                // save handled by parent / useBoards.updateBoard (not wired here to keep scope)
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape")
                  titleRef.current?.blur();
              }}
              className="bg-transparent text-xl font-bold text-zinc-100 outline-none border-b border-zinc-600"
            />
          ) : (
            <h1
              className="cursor-text text-xl font-bold text-zinc-100 hover:opacity-80"
              onClick={() => setEditingTitle(true)}
            >
              {board.name}
            </h1>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === tab.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Board Content ──────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        {activeView === "table" && (
          <BoardTableView
            boardId={board.id}
            columns={columns.filter((c) => c.is_visible)}
            groups={groups}
            itemsByGroup={itemsByGroup}
            onAddGroup={handleAddGroup}
            onAddItem={handleAddItem}
            onUpdateItemName={updateItemName}
            onUpdateItemValue={(itemId, colId, value) =>
              updateItemValue(itemId, colId, value)
            }
            onDeleteItem={deleteItem}
            onToggleGroupCollapsed={toggleGroupCollapsed}
            onReorderItems={reorderItems}
            onAddColumn={handleAddColumn}
          />
        )}
        {activeView === "kanban" && <ComingSoon label="Kanban" />}
        {activeView === "calendar" && <ComingSoon label="Calendario" />}
      </div>
    </div>
  );
}
