import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Film,
  CheckCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { VideoQueueCard } from '../components/video/VideoQueueCard';
import { useVideoQueue, useVideoMetrics, deleteVideoItem } from '../hooks/useVideoProducer';

// ═══════════════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

const MetricCard = ({ icon, label, value, color = 'text-[#58a6ff]' }: MetricCardProps) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-[#0d1117] ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-[#8b949e] mb-1">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoProducerDashboard = () => {
  const navigate = useNavigate();
  const { items: videos, loading } = useVideoQueue();
  const { metrics } = useVideoMetrics();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      if (statusFilter && video.status !== statusFilter) return false;
      if (brandFilter && video.brand !== brandFilter) return false;
      if (formatFilter && video.format !== formatFilter) return false;
      return true;
    });
  }, [videos, statusFilter, brandFilter, formatFilter]);

  const handleDelete = async (id: string) => {
    try {
      await deleteVideoItem(id);
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setBrandFilter('');
    setFormatFilter('');
  };

  const activeFilterCount = [statusFilter, brandFilter, formatFilter].filter(Boolean).length;

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Video size={26} className="text-[#58a6ff]" />
              Video Producer
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Produção automatizada de conteúdo em vídeo
            </p>
          </div>
          <button
            onClick={() => navigate('/video-producer/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Novo Vídeo
          </button>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                <div className="h-10 bg-[#0d1117] rounded mb-2" />
                <div className="h-6 bg-[#0d1117] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Film size={20} />}
              label="Total Vídeos"
              value={metrics.total}
            />
            <MetricCard
              icon={<Loader2 size={20} className="animate-spin" />}
              label="Em Produção"
              value={metrics.producing}
              color="text-[#58a6ff]"
            />
            <MetricCard
              icon={<CheckCircle size={20} />}
              label="Prontos"
              value={metrics.ready}
              color="text-[#3fb950]"
            />
            <MetricCard
              icon={<Send size={20} />}
              label="Publicados"
              value={metrics.published}
              color="text-[#a371f7]"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Status */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="audio_generating">Gerando Áudio</option>
              <option value="audio_ready">Áudio Pronto</option>
              <option value="video_generating">Gerando Vídeo</option>
              <option value="video_ready">Vídeo Pronto</option>
              <option value="publishing">Publicando</option>
              <option value="published">Publicado</option>
              <option value="failed">Com Erro</option>
            </select>

            {/* Brand */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">Todas as marcas</option>
              <option value="vertex">Vertex</option>
              <option value="socialfy">Socialfy</option>
              <option value="mottivme">MOTTIVME</option>
            </select>

            {/* Format */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
            >
              <option value="">Todos os formatos</option>
              <option value="reel">Reel</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="carrossel">Carrossel</option>
            </select>

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-[#0d1117] hover:bg-[#f85149]/10 border border-[#30363d] hover:border-[#f85149]/40 text-[#f85149] rounded-lg text-sm font-medium transition-colors"
              >
                Limpar filtros ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Videos Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[#0d1117]" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-[#0d1117] rounded w-3/4" />
                    <div className="h-3 bg-[#0d1117] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={32} className="text-[#58a6ff]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum vídeo na fila</h3>
              <p className="text-sm text-[#8b949e] mb-4">
                {activeFilterCount > 0
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Crie seu primeiro vídeo para começar'}
              </p>
              <button
                onClick={() => navigate('/video-producer/new')}
                className="px-6 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Criar Vídeo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <VideoQueueCard key={video.id} video={video} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoProducerDashboard;
