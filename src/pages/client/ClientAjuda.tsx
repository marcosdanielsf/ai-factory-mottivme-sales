import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Book,
  Video,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Clock,
} from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "Como editar o comportamento do meu agente?",
    answer:
      'Acesse "Meu Agente" no menu lateral, clique em "Editar com IA" e descreva as mudancas que deseja. O Engenheiro de Prompts vai sugerir as alteracoes e voce pode aprovar ou rejeitar cada uma.',
  },
  {
    question: "O que significa cada nota no Score do Agente?",
    answer:
      "O Score avalia: Tom de voz (adequacao ao publico), Engajamento (capacidade de manter conversa), Tratamento de objecoes, Qualificacao (identificar leads qualificados), e Fechamento (converter em agendamentos).",
  },
  {
    question: "Como acompanhar as conversas do agente?",
    answer:
      'Va em "Conversas" para ver todas as interacoes. Voce pode filtrar por status (ativas, pendentes, concluidas) e buscar por nome ou conteudo das mensagens.',
  },
  {
    question: "Posso desfazer alteracoes no agente?",
    answer:
      'Sim! Cada alteracao fica salva no historico de versoes. Voce pode voltar para qualquer versao anterior a qualquer momento na pagina "Meu Agente".',
  },
  {
    question: "Como melhorar a taxa de conversao?",
    answer:
      "Analise as conversas onde o agente nao conseguiu agendar, identifique padroes de objecoes, e use o Engenheiro de Prompts para ensinar o agente a lidar melhor com essas situacoes.",
  },
  {
    question: "O agente funciona 24 horas?",
    answer:
      "Sim! Seu agente responde automaticamente a qualquer momento. Voce pode configurar horarios especificos de atendimento e mensagens fora de horario nas configuracoes.",
  },
];

const FAQItem = ({ faq }: { faq: FAQ }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border-default last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-accent-primary transition-colors"
      >
        <span className="font-medium text-text-primary pr-4">
          {faq.question}
        </span>
        {isOpen ? (
          <ChevronDown size={20} className="text-accent-primary shrink-0" />
        ) : (
          <ChevronRight size={20} className="text-text-muted shrink-0" />
        )}
      </button>
      {isOpen && (
        <p className="pb-4 text-text-secondary text-sm leading-relaxed">
          {faq.answer}
        </p>
      )}
    </div>
  );
};

const ResourceCard = ({
  icon: Icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action: string;
  href?: string;
}) => (
  <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
    <div className="p-3 bg-accent-primary/10 rounded-xl w-fit mb-4">
      <Icon size={24} className="text-accent-primary" />
    </div>
    <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
    <p className="text-sm text-text-muted mb-4">{description}</p>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-accent-primary text-sm font-medium hover:underline"
      >
        {action}
        <ExternalLink size={14} />
      </a>
    ) : (
      <span className="text-accent-primary text-sm font-medium cursor-pointer hover:underline">
        {action}
      </span>
    )}
  </div>
);

export const ClientAjuda = () => {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
          <HelpCircle className="text-accent-primary" size={28} />
          Central de Ajuda
        </h1>
        <p className="text-text-secondary mt-1">
          Tire suas duvidas e aprenda a usar seu agente de vendas
        </p>
      </div>

      {/* Quick Resources */}
      <div className="grid md:grid-cols-3 gap-4">
        <ResourceCard
          icon={Book}
          title="Guia Rapido"
          description="Aprenda o basico em 5 minutos"
          action="Acessar guia"
        />
        <ResourceCard
          icon={Video}
          title="Video Tutoriais"
          description="Assista demonstracoes praticas"
          action="Ver videos"
        />
        <ResourceCard
          icon={MessageCircle}
          title="Suporte"
          description="Fale com nossa equipe"
          action="Abrir chat"
        />
      </div>

      {/* FAQ Section */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Perguntas Frequentes
        </h2>
        <div>
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} />
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-accent-primary/10 via-purple-500/10 to-cyan-500/10 border border-accent-primary/30 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Precisa de mais ajuda?
        </h2>
        <p className="text-text-secondary mb-6">
          Nossa equipe esta disponivel para ajudar voce a tirar o maximo do seu
          agente de vendas.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="p-2 bg-bg-secondary rounded-lg">
              <Mail size={18} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Email</p>
              <p className="text-sm text-text-primary">suporte@mottivme.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-text-secondary">
            <div className="p-2 bg-bg-secondary rounded-lg">
              <Phone size={18} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">WhatsApp</p>
              <p className="text-sm text-text-primary">(11) 99999-0000</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-text-secondary">
            <div className="p-2 bg-bg-secondary rounded-lg">
              <Clock size={18} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Horario</p>
              <p className="text-sm text-text-primary">Seg-Sex, 9h-18h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
