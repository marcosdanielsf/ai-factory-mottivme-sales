-- =============================================
-- mottivme_tasks — Project board / Kanban
-- Criada em: 2026-02-18
-- =============================================

CREATE TABLE IF NOT EXISTS mottivme_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_key text NOT NULL DEFAULT 'mottivme-geral',
  parent_task_id uuid REFERENCES mottivme_tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  notes text,
  status text NOT NULL DEFAULT 'backlog',
  priority text DEFAULT 'p3',
  business_sector text,
  assigned_to text,
  due_date date,
  time_spent_minutes int DEFAULT 0,
  tags text[] DEFAULT '{}',
  external_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes para queries frequentes
CREATE INDEX IF NOT EXISTS idx_mottivme_tasks_project ON mottivme_tasks(project_key);
CREATE INDEX IF NOT EXISTS idx_mottivme_tasks_status ON mottivme_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mottivme_tasks_priority ON mottivme_tasks(priority);

-- RLS: permitir acesso autenticado (admin-only por enquanto)
ALTER TABLE mottivme_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all tasks"
  ON mottivme_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON mottivme_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON mottivme_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON mottivme_tasks FOR DELETE
  TO authenticated
  USING (true);
