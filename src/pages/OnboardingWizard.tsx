import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Mic, MicOff, Check, Loader2, Sparkles } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';

// ============ TYPES ============

interface OnboardingAnswer {
  questionId: number;
  text: string;
  audioData?: string; // base64 encoded audio
}

interface OnboardingData {
  name: string;
  answers: OnboardingAnswer[];
}

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingData) => void;
  skipIntro?: boolean;
}

// ============ QUESTIONS ============

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    title: "Vamos começar!",
    question: "Qual é o seu produto ou serviço?",
    placeholder: "Descreva o que você vende...",
    example: "Ex: Mentoria de high ticket para médicos, consultoria de vendas, etc.",
    required: true,
  },
  {
    id: 2,
    title: "Como funciona?",
    question: "Como o seu produto/serviço funciona?",
    placeholder: "Explique o processo...",
    example: "Ex: O cliente participa de 4 aulas ao vivo, tem acesso ao grupo VIP...",
    required: true,
  },
  {
    id: 3,
    title: "Limites claros",
    question: "O que você NÃO faz? (Para não criar expectativa errada)",
    placeholder: "O que está fora do seu escopo...",
    example: "Ex: Não trabalho com e-commerce, não vendo produto físico...",
    required: true,
  },
  {
    id: 4,
    title: "Benefícios",
    question: "Quais são os 3 principais benefícios que o cliente recebe?",
    placeholder: "Liste os benefícios...",
    example: "Ex: Aumento de 30% em vendas, equipe treinada, automação...",
    required: true,
  },
  {
    id: 5,
    title: "Cliente ideal",
    question: "Quem é o seu cliente ideal?",
    placeholder: "Descreva seu público...",
    example: "Ex: Médicos com clínica própria, mentores que vendem high ticket...",
    required: true,
  },
  {
    id: 6,
    title: "Ticket médio",
    question: "Qual é o valor médio do seu produto/serviço?",
    placeholder: "R$ 0,00",
    example: "Ex: R$ 5.000, R$ 10.000, etc.",
    required: true,
  },
  {
    id: 7,
    title: "Meta de lucro",
    question: "Qual é a sua meta de lucro diária?",
    placeholder: "R$ 0,00",
    example: "Ex: R$ 1.000, R$ 3.000, etc.",
    required: true,
  },
];

// ============ AUDIO HOOK ============

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setAudioUrl(null);
    chunksRef.current = [];
  };

  return {
    isRecording,
    audioUrl,
    isProcessing,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

// ============ PROGRESS BAR ============

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// ============ STEP INDICATORS ============

interface StepIndicatorsProps {
  steps: number;
  current: number;
}

const StepIndicators: React.FC<StepIndicatorsProps> = ({ steps, current }) => {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: steps }).map((_, i) => (
        <button
          key={i}
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${i < current
              ? 'bg-accent-primary scale-110'
              : i === current
              ? 'bg-accent-primary scale-125 ring-4 ring-accent-primary/20'
              : 'bg-bg-tertiary'
            }
          `}
          aria-label={`Step ${i + 1}`}
        />
      ))}
    </div>
  );
};

// ============ QUESTION CARD ============

interface QuestionCardProps {
  question: typeof ONBOARDING_QUESTIONS[0];
  answer: string;
  audioUrl: string | null;
  isRecording: boolean;
  onTextChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearAudio: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  canProceed: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  audioUrl,
  isRecording,
  onTextChange,
  onStartRecording,
  onStopRecording,
  onClearAudio,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  canProceed,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-accent-primary text-sm font-medium uppercase tracking-wider">
          {question.title}
        </span>
        <h2 className="text-2xl font-bold text-text-primary mt-2">
          {question.question}
        </h2>
        {question.example && (
          <p className="text-text-muted text-sm mt-2">{question.example}</p>
        )}
      </div>

      {/* Text Input */}
      <div className="mb-6">
        <textarea
          value={answer}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={question.placeholder}
          className="w-full bg-bg-tertiary border border-border-default rounded-xl p-4 text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
          rows={4}
          autoFocus
        />
        <p className="text-text-muted text-xs mt-2 text-right">
          {answer.length} caracteres
        </p>
      </div>

      {/* Audio Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-muted">Ou responda com áudio:</span>
          {audioUrl && (
            <button
              onClick={playAudio}
              className="text-accent-primary text-sm hover:underline flex items-center gap-1"
            >
              <Mic size={14} /> Ouvir resposta
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!audioUrl ? (
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${isRecording
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  : 'bg-bg-tertiary text-text-primary hover:bg-accent-primary hover:text-white border border-border-default'
                }
              `}
            >
              {isRecording ? (
                <>
                  <MicOff size={18} />
                  <span>Parar gravação</span>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>Gravar resposta</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-accent-primary/10 border border-accent-primary/30 rounded-xl px-4 py-2">
              <Check className="text-accent-primary" size={18} />
              <span className="text-sm text-accent-primary">Áudio gravado com sucesso!</span>
              <button
                onClick={onClearAudio}
                className="text-text-muted hover:text-red-400 transition-colors text-sm"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border-default">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all
            ${isFirst
              ? 'opacity-30 cursor-not-allowed text-text-muted'
              : 'text-text-primary hover:bg-bg-tertiary'
            }
          `}
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
            ${canProceed
              ? 'bg-accent-primary text-white hover:bg-accent-primary/90 shadow-lg shadow-accent-primary/20'
              : 'opacity-50 cursor-not-allowed bg-bg-tertiary text-text-muted'
            }
          `}
        >
          {isLast ? (
            <>
              Finalizar
              <Check size={18} />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============ INTRO SCREEN ============

interface IntroScreenProps {
  onStart: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-10 shadow-xl max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-primary/30">
        <Sparkles className="text-white" size={36} />
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-3">
        Bem-vindo ao SocialFi
      </h1>

      <p className="text-text-muted mb-8 max-w-md mx-auto">
        Configure seu time de vendas com IA em menos de 5 minutos.
        Responda 7 perguntas sobre seu negócio e deixe a IA fazer o resto.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Mic, label: "Responda por texto ou áudio" },
          { icon: "⚡", label: "Leva menos de 5 minutos" },
          { icon: "🤖", label: "IA cria tudo automaticamente" },
        ].map((item, i) => (
          <div key={i} className="bg-bg-tertiary rounded-xl p-4">
            <div className="text-2xl mb-2">{typeof item.icon === 'string' ? item.icon : <item.icon size={24} className="text-accent-primary mx-auto" />}</div>
            <p className="text-xs text-text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="bg-gradient-to-r from-accent-primary to-accent-secondary text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-accent-primary/30 transition-all flex items-center gap-2 mx-auto"
      >
        Começar agora
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ============ SUCCESS SCREEN ============

interface SuccessScreenProps {
  data: OnboardingData;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ data }) => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-10 shadow-xl max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="text-green-500" size={36} />
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-3">
        Tudo pronto, {data.name}!
      </h1>

      <p className="text-text-muted mb-8 max-w-md mx-auto">
        Suas respostas foram salvas. A IA está configurando seu time de vendas personalizado.
        Você receberá uma notificação quando tudo estiver pronto.
      </p>

      <div className="bg-bg-tertiary rounded-xl p-6 mb-8">
        <h3 className="text-sm font-medium text-text-muted mb-4">O que será criado:</h3>
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            "🤖 Agente BDR - Prospecção",
            "💬 Agente SDR - Qualificação",
            "📱 Social Seller - Instagram",
            "📅 Concierge - Agendamentos",
            "🎯 Closer - Fechamentos",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
              <Check className="text-accent-primary" size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="bg-accent-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-accent-primary/90 transition-all"
      >
        Ir para o Dashboard
      </button>
    </div>
  );
};

// ============ MAIN WIZARD ============

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  skipIntro = false,
}) => {
  // Hooks
  const { saveOnboarding, isSaving } = useOnboarding();

  // State
  const [step, setStep] = useState(skipIntro ? 1 : 0);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Audio recorder for current step
  const { isRecording, audioUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();

  // Get current answer
  const currentAnswer = answers.find(a => a.questionId === ONBOARDING_QUESTIONS[step - 1]?.id);

  // Handle name input (intro step)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setStep(1);
    }
  };

  // Handle text change
  const handleTextChange = (value: string) => {
    const questionId = ONBOARDING_QUESTIONS[step - 1].id;
    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId);
      const newAnswer: OnboardingAnswer = {
        questionId,
        text: value,
        audioData: audioUrl || undefined,
      };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...newAnswer };
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  // Handle navigation
  const handleNext = () => {
    if (step < ONBOARDING_QUESTIONS.length) {
      // Clear audio before moving to next
      clearRecording();
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      clearRecording();
      setStep(step - 1);
    } else {
      setStep(0);
    }
  };

  // Handle completion
  const handleComplete = async () => {
    setIsProcessing(true);
    setSaveError(null);
    const data: OnboardingData = { name, answers };

    try {
      // Salvar no Supabase
      const result = await saveOnboarding(data);

      if (!result.success) {
        setSaveError(result.error || 'Erro ao salvar. Tente novamente.');
        setIsProcessing(false);
        return;
      }

      if (onComplete) {
        await onComplete(data);
      }

      setStep(-1); // Success screen
    } catch (err) {
      console.error('Error saving onboarding:', err);
      setSaveError('Erro ao processar. Tente novamente.');
      setIsProcessing(false);
    }
  };

  // Check if can proceed
  const canProceed = currentAnswer?.text.trim().length > 0 || audioUrl !== null;

  // Render
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">SocialFi</h1>
        <p className="text-text-muted text-sm">Time de Vendas com IA</p>
      </div>

      {/* Intro Screen */}
      {step === 0 && (
        <>
          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
              placeholder="Como você gostaria de ser chamado?"
              className="w-full max-w-md bg-bg-secondary border border-border-default rounded-xl p-4 text-text-primary placeholder-text-muted text-center focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-lg"
              autoFocus
            />
          </div>
          <IntroScreen onStart={() => name.trim() && setStep(1)} />
        </>
      )}

      {/* Questions */}
      {step > 0 && step <= ONBOARDING_QUESTIONS.length && (
        <>
          {/* Progress */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex justify-between text-sm text-text-muted mb-2">
              <span>Progresso</span>
              <span>{step} de {ONBOARDING_QUESTIONS.length}</span>
            </div>
            <ProgressBar current={step} total={ONBOARDING_QUESTIONS.length} />
          </div>

          <StepIndicators steps={ONBOARDING_QUESTIONS.length} current={step} />

          <QuestionCard
            question={ONBOARDING_QUESTIONS[step - 1]}
            answer={currentAnswer?.text || ''}
            audioUrl={audioUrl}
            isRecording={isRecording}
            onTextChange={handleTextChange}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onClearAudio={clearRecording}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirst={step === 1}
            isLast={step === ONBOARDING_QUESTIONS.length}
            canProceed={canProceed}
          />
        </>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-10 shadow-xl max-w-md mx-auto text-center">
          <Loader2 className="animate-spin text-accent-primary mx-auto mb-4" size={36} />
          <h2 className="text-xl font-bold text-text-primary mb-2">Configurando seu time...</h2>
          <p className="text-text-muted">Isso pode levar alguns segundos.</p>
          {saveError && (
            <p className="text-red-400 text-sm mt-4">{saveError}</p>
          )}
        </div>
      )}

      {/* Success Screen */}
      {step === -1 && (
        <SuccessScreen data={{ name, answers }} />
      )}
    </div>
  );
};

export default OnboardingWizard;
