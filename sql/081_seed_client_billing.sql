-- Migration 081: Seed client_billing com dados dos clientes MOTTIVME
-- IMPORTANTE: valores de revenue_brl sao ESTIMATIVAS — ajustar com dados reais
-- Jarbas: R$4.000 confirmado. Demais: estimados pelo range R$2K-R$8K.
--
-- Para corrigir um valor:
--   UPDATE client_billing SET revenue_brl = 5000 WHERE location_id = 'xxx' AND month = '2026-03-01';

-- ============================================================================
-- Clientes ATIVOS
-- ============================================================================

-- 1. Dra. Gabriella Rossmann — clinicas — ativa desde ~set/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2025-09-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2025-10-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2025-11-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2025-12-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2026-01-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2026-02-01', 4000, 'recurring', true, '2025-09-01'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriella Rossmann', '2026-03-01', 4000, 'recurring', true, '2025-09-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 2. Fernanda Lappe — financeiro — ativa desde ~out/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2025-10-01', 3000, 'recurring', true, '2025-10-01'),
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2025-11-01', 3000, 'recurring', true, '2025-10-01'),
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2025-12-01', 3000, 'recurring', true, '2025-10-01'),
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2026-01-01', 3000, 'recurring', true, '2025-10-01'),
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2026-02-01', 3000, 'recurring', true, '2025-10-01'),
  ('EKHxHl3KLPN0iRc69GNU', 'Fernanda Lappe', '2026-03-01', 3000, 'recurring', true, '2025-10-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 3. Flavia Leal — servicos — ativa desde ~nov/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal', '2025-11-01', 3500, 'recurring', true, '2025-11-01'),
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal', '2025-12-01', 3500, 'recurring', true, '2025-11-01'),
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal', '2026-01-01', 3500, 'recurring', true, '2025-11-01'),
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal', '2026-02-01', 3500, 'recurring', true, '2025-11-01'),
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal', '2026-03-01', 3500, 'recurring', true, '2025-11-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 4. Heloise Silvestre — servicos — ativa desde ~out/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2025-10-01', 2500, 'recurring', true, '2025-10-01'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2025-11-01', 2500, 'recurring', true, '2025-10-01'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2025-12-01', 2500, 'recurring', true, '2025-10-01'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2026-01-01', 2500, 'recurring', true, '2025-10-01'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2026-02-01', 2500, 'recurring', true, '2025-10-01'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Heloise Silvestre', '2026-03-01', 2500, 'recurring', true, '2025-10-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 5. Luiz Augusto (Instituto Amare) — clinicas — ativo desde ~ago/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2025-08-01', 6000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2025-09-01', 6000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2025-10-01', 6000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2025-11-01', 6000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2025-12-01', 6000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2026-01-01', 8000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2026-02-01', 8000, 'recurring', true, '2025-08-01'),
  ('sNwLyynZWP6jEtBy1ubf', 'Luiz Augusto - Instituto Amare', '2026-03-01', 8000, 'recurring', true, '2025-08-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 6. Marina Couto (Dream Makers) — financeiro — ativa desde ~set/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2025-09-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2025-10-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2025-11-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2025-12-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2026-01-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2026-02-01', 3500, 'recurring', true, '2025-09-01'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto - Dream Makers', '2026-03-01', 3500, 'recurring', true, '2025-09-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 7. Milton Abreu — financeiro — ativo desde ~out/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2025-10-01', 3000, 'recurring', true, '2025-10-01'),
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2025-11-01', 3000, 'recurring', true, '2025-10-01'),
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2025-12-01', 3000, 'recurring', true, '2025-10-01'),
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2026-01-01', 3000, 'recurring', true, '2025-10-01'),
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2026-02-01', 3000, 'recurring', true, '2025-10-01'),
  ('mHuN6v75KQc3lwmBd6mV', 'Milton Abreu', '2026-03-01', 3000, 'recurring', true, '2025-10-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 8. Thauan Santos (Abadi Santos) — servicos — ativo desde ~out/2025
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2025-10-01', 2500, 'recurring', true, '2025-10-01'),
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2025-11-01', 2500, 'recurring', true, '2025-10-01'),
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2025-12-01', 2500, 'recurring', true, '2025-10-01'),
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2026-01-01', 2500, 'recurring', true, '2025-10-01'),
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2026-02-01', 2500, 'recurring', true, '2025-10-01'),
  ('Rre0WqSlmAPmIrURgiMf', 'Thauan Santos - Abadi Santos', '2026-03-01', 2500, 'recurring', true, '2025-10-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 9. Jarbas Teixeira — imobiliaria — ativo desde fev/2026 — R$4.000 CONFIRMADO
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('x7XafRxWaLa0EheQcaGS', 'Jarbas Teixeira - Sala Boston', '2026-02-01', 4000, 'recurring', true, '2026-02-01'),
  ('x7XafRxWaLa0EheQcaGS', 'Jarbas Teixeira - Sala Boston', '2026-03-01', 4000, 'recurring', true, '2026-02-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 10. Dra. Carolina Simonatto — clinicas — prospect ativo desde ~fev/2026
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, acquisition_date)
VALUES
  ('mfOxMOpk3DoQXRB47MgS', 'Dra. Carolina Simonatto', '2026-02-01', 4000, 'recurring', true, '2026-02-01'),
  ('mfOxMOpk3DoQXRB47MgS', 'Dra. Carolina Simonatto', '2026-03-01', 4000, 'recurring', true, '2026-02-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- ============================================================================
-- Clientes CHURNED (historico)
-- ============================================================================

-- 11. Dr. Alberto Correia — clinicas — churnou ~jan/2026
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, churn_date, acquisition_date)
VALUES
  ('GT77iGk2WDneoHwtuq6D', 'Dr. Alberto Correia', '2025-09-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('GT77iGk2WDneoHwtuq6D', 'Dr. Alberto Correia', '2025-10-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('GT77iGk2WDneoHwtuq6D', 'Dr. Alberto Correia', '2025-11-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('GT77iGk2WDneoHwtuq6D', 'Dr. Alberto Correia', '2025-12-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- 12. Dra. Eline Lobo — clinicas — churnou ~jan/2026
INSERT INTO client_billing (location_id, location_name, month, revenue_brl, contract_type, is_active, churn_date, acquisition_date)
VALUES
  ('pFHwENFUxjtiON94jn2k', 'Dra. Eline Lobo', '2025-09-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('pFHwENFUxjtiON94jn2k', 'Dra. Eline Lobo', '2025-10-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('pFHwENFUxjtiON94jn2k', 'Dra. Eline Lobo', '2025-11-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01'),
  ('pFHwENFUxjtiON94jn2k', 'Dra. Eline Lobo', '2025-12-01', 3000, 'recurring', false, '2026-01-15', '2025-09-01')
ON CONFLICT (location_id, month) DO UPDATE SET revenue_brl = EXCLUDED.revenue_brl;

-- ============================================================================
-- RESUMO ESTIMADO (ajustar com dados reais):
-- MRR mar/2026: ~R$42.000 (10 ativos)
-- Ticket medio: ~R$4.200
-- Churn: 2 clientes (Alberto + Eline) em jan/2026
--
-- VALORES CONFIRMADOS: Jarbas R$4.000
-- VALORES ESTIMADOS: todos os demais (ajustar!)
-- ============================================================================
