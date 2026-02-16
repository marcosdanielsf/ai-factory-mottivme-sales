import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play } from 'lucide-react';
import type { VideoFormat, TACOTrack } from '../hooks/useVideoProducer';
import { useVideoVoices, useVideoAvatars, createVideoItem, triggerVideoProduction } from '../hooks/useVideoProducer';

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoProducerNew = () => {
  const navigate = useNavigate();
  const { voices } = useVideoVoices();
  const { avatars } = useVideoAvatars();

  // Form state
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [format, setFormat] = useState<VideoFormat>('reel');
  const [duration, setDuration] = useState(45);
  const [tacoTrack, setTacoTrack] = useState<TACOTrack>('T');
  const [voiceId, setVoiceId] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChannelToggle = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const buildVideoData = () => ({
    title,
    script,
    format,
    duration_target: duration,
    taco_track: tacoTrack,
    status: 'draft' as const,
    voice_id: voiceId || null,
    avatar_id: avatarId || null,
    publish_channels: channels,
    scheduled_at: scheduleDate || null,
    brand: 'mottivme' as const,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await createVideoItem(buildVideoData());
      navigate('/video-producer');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  };

  const handleStartProduction = async () => {
    setSaving(true);
    try {
      const newId = await createVideoItem(buildVideoData());
      await triggerVideoProduction(newId);
      navigate('/video-producer');
    } catch (error) {
      console.error('Error starting production:', error);
      alert('Erro ao iniciar produção');
    } finally {
      setSaving(false);
    }
  };

  const getTACOColor = (track: TACOTrack) => {
    const colors = {
      T: '#58a6ff',
      A: '#3fb950',
      C: '#d29922',
      O: '#a371f7',
      H: '#f85149',
    };
    return colors[track] || '#8b949e';
  };

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/video-producer')}
            className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline mb-3"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <h1 className="text-2xl font-semibold text-white">Novo Vídeo</h1>
          <p className="text-sm text-[#8b949e] mt-1">Preencha os detalhes para criar um novo vídeo</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* 1. Conteúdo */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Conteúdo</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">Título</label>
                <input
                  type="text"
                  placeholder="Ex: Como fechar mais vendas com IA em 2026"
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white placeholder:text-[#6e7681]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Script */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">Roteiro</label>
                <textarea
                  placeholder="Escreva o roteiro completo do vídeo aqui..."
                  className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white placeholder:text-[#6e7681] min-h-[200px] resize-y"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
                <p className="text-xs text-[#6e7681] mt-1">{script.length} caracteres</p>
              </div>

              {/* Format & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">Formato</label>
                  <div className="flex gap-2">
                    {(['reel', 'short', 'long', 'carrossel'] as VideoFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                          format === f
                            ? 'bg-[#58a6ff]/10 border-[#58a6ff]/40 text-[#58a6ff]'
                            : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/20'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8b949e] mb-2">Duração</label>
                  <select
                    className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={30}>30 segundos</option>
                    <option value={45}>45 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={90}>1m 30s</option>
                    <option value={120}>2 minutos</option>
                    <option value={180}>3 minutos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Trilha TACO */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Trilha TACO</h2>
            <div className="flex gap-3">
              {(['T', 'A', 'C', 'O', 'H'] as TACOTrack[]).map((track) => (
                <button
                  key={track}
                  onClick={() => setTacoTrack(track)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    tacoTrack === track
                      ? 'border-2'
                      : 'bg-[#0d1117] border-[#30363d] hover:border-opacity-60'
                  }`}
                  style={{
                    backgroundColor: tacoTrack === track ? `${getTACOColor(track)}20` : undefined,
                    borderColor: getTACOColor(track),
                    color: getTACOColor(track),
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTACOColor(track) }}
                  />
                  {track}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6e7681] mt-3">
              <strong>T</strong>opo de Funil | <strong>A</strong>tração | <strong>C</strong>onversão |{' '}
              <strong>O</strong>bjection Handling | <strong>H</strong>and Raiser
            </p>
          </div>

          {/* 3. Voz & Avatar */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Voz & Avatar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">Voz</label>
                <select
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  <option value="">Selecione uma voz</option>
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">Avatar</label>
                <select
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                >
                  <option value="">Selecione um avatar</option>
                  {avatars.map((avatar) => (
                    <option key={avatar.id} value={avatar.id}>
                      {avatar.name} ({avatar.style})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Publicação */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Publicação</h2>
            <div className="space-y-4">
              {/* Channels */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">Canais</label>
                <div className="flex flex-wrap gap-2">
                  {['instagram', 'linkedin', 'youtube', 'tiktok'].map((channel) => (
                    <button
                      key={channel}
                      onClick={() => handleChannelToggle(channel)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                        channels.includes(channel)
                          ? 'bg-[#58a6ff]/10 border-[#58a6ff]/40 text-[#58a6ff]'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/20'
                      }`}
                    >
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Agendar publicação (opcional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-[#58a6ff]/40 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button
              onClick={handleStartProduction}
              disabled={saving || !title || !script}
              className="flex items-center gap-2 px-6 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              {saving ? 'Iniciando...' : 'Iniciar Produção'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProducerNew;
