import React from 'react';
import {
  Building2,
  Bot,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Clock,
  Cpu,
  Hash,
  RefreshCw
} from 'lucide-react';
import { ToggleSwitch, StatusBadge } from './StatCard';

interface AgentVersion {
  id: string;
  version: string;
  status: string;
  isActive: boolean;
  totalTestRuns: number;
  lastTestScore: number | null;
  updatedAt: string;
}

interface LocationVersions {
  locationId: string;
  agentName: string;
  versions: AgentVersion[];
}

interface AgentVersionsSectionProps {
  versionsByLocation: LocationVersions[];
  expandedLocations: Set<string>;
  onToggleLocation: (locationId: string) => void;
  versionsLoading: boolean;
  versionUpdating: string | null;
  onToggleVersion: (versionId: string, currentActive: boolean) => void;
  isMobile: boolean;
  formatDate: (dateStr: string) => string;
}

export function AgentVersionsSection({
  versionsByLocation,
  expandedLocations,
  onToggleLocation,
  versionsLoading,
  versionUpdating,
  onToggleVersion,
  isMobile,
  formatDate
}: AgentVersionsSectionProps) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="p-3 md:p-4 border-b border-border-default flex items-center justify-between">
        <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm md:text-base">
          <Layers size={18} className="text-blue-400" />
          <span className="hidden md:inline">Versões de Agentes por Cliente</span>
          <span className="md:hidden">Versões</span>
        </h3>
        <span className="text-[10px] md:text-xs text-text-muted">
          {versionsByLocation.reduce((acc, loc) => acc + loc.versions.length, 0)} versões
        </span>
      </div>

      {versionsLoading ? (
        <div className="p-8 text-center">
          <RefreshCw className="animate-spin mx-auto text-text-muted mb-2" size={24} />
          <p className="text-sm text-text-muted">Carregando versões...</p>
        </div>
      ) : versionsByLocation.length === 0 ? (
        <div className="p-8 text-center">
          <Layers className="mx-auto text-text-muted mb-2" size={24} />
          <p className="text-sm text-text-muted">Nenhuma versão encontrada</p>
        </div>
      ) : (
        <div className="divide-y divide-border-default">
          {versionsByLocation.map((location) => (
            <div key={location.locationId}>
              {/* Header do Cliente */}
              <button
                onClick={() => onToggleLocation(location.locationId)}
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    <Bot size={isMobile ? 16 : 20} className="text-text-muted" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-text-primary text-sm md:text-base truncate">{location.agentName}</p>
                    <p className="text-[10px] md:text-xs text-text-muted truncate hidden md:block">{location.locationId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[10px] md:text-xs text-text-muted">{location.versions.length}</span>
                    <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {location.versions.filter(v => v.isActive).length} <span className="hidden md:inline">ativas</span>
                    </span>
                  </div>
                  {expandedLocations.has(location.locationId) ? (
                    <ChevronUp size={18} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={18} className="text-text-muted" />
                  )}
                </div>
              </button>

              {/* Lista de Versões Expandida */}
              {expandedLocations.has(location.locationId) && (
                <div className="bg-bg-tertiary/20 border-t border-border-default">
                  {isMobile ? (
                    /* VERSÃO MOBILE - Cards de versões */
                    <div className="divide-y divide-border-default/50 p-3 space-y-2">
                      {location.versions.map((version) => (
                        <div key={version.id} className="bg-bg-primary rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-text-primary">v{version.version}</span>
                                <StatusBadge status={version.status} />
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                                <span>{version.totalTestRuns} testes</span>
                                {version.lastTestScore !== null && (
                                  <span className={version.lastTestScore >= 7 ? 'text-emerald-400' : version.lastTestScore >= 4 ? 'text-amber-400' : 'text-red-400'}>
                                    Score: {version.lastTestScore.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              isOn={version.isActive}
                              onToggle={() => onToggleVersion(version.id, version.isActive)}
                              loading={versionUpdating === version.id}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* VERSÃO DESKTOP - Tabela */
                    <table className="w-full">
                      <thead>
                        <tr className="bg-bg-tertiary/50">
                          <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Versão</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Status</th>
                          <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Testes</th>
                          <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Score</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Atualizado</th>
                          <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Ativo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/50">
                        {location.versions.map((version) => (
                          <tr key={version.id} className="hover:bg-bg-tertiary/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Hash size={14} className="text-text-muted" />
                                <span className="font-mono text-sm text-text-primary">{version.version}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={version.status} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-sm text-text-primary">{version.totalTestRuns}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {version.lastTestScore !== null ? (
                                <span className={`text-sm font-medium ${
                                  version.lastTestScore >= 7 ? 'text-emerald-400' :
                                  version.lastTestScore >= 4 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {version.lastTestScore.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-xs text-text-muted">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Clock size={12} />
                                {formatDate(version.updatedAt)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <ToggleSwitch
                                  isOn={version.isActive}
                                  onToggle={() => onToggleVersion(version.id, version.isActive)}
                                  loading={versionUpdating === version.id}
                                />
                                <span className={`text-xs ${version.isActive ? 'text-emerald-400' : 'text-text-muted'}`}>
                                  {version.isActive ? 'ON' : 'OFF'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
