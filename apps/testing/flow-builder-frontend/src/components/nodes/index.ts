export { ModeNode } from './ModeNode';
export { EtapaNode } from './EtapaNode';
export { MensagemNode } from './MensagemNode';
export { ScriptNode } from './ScriptNode';
export { DecisaoNode } from './DecisaoNode';
export { SimulacaoNode } from './SimulacaoNode';

export const nodeTypes = {
  mode: ModeNode,
  etapa: EtapaNode,
  mensagem: MensagemNode,
  script: ScriptNode,
  decisao: DecisaoNode,
  simulacao: SimulacaoNode,
} as const;
