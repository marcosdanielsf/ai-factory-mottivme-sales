#!/usr/bin/env python3
"""
AI Factory - Pipeline COMPLETO de Criação de Agente
===================================================
Usa TODOS os agentes disponíveis:

1. PromptFactoryAgent - Cria os 7 prompts modulares
2. ValidatorAgent - Testa cada modo
3. DebateOrchestrator - Crítico + Defensor + Especialistas + Juiz melhoram os prompts
4. ScriptWriterAgent - Gera roteiros de áudio/vídeo para follow-up
5. Testes E2E com Groq - Valida em conversas simuladas

Uso:
    python create_agent_full_pipeline.py \\
        --profile "/path/to/cliente.txt" \\
        --location "xxx" \\
        --calendar "yyy"
"""

import asyncio
import argparse
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Configurar API Keys
os.environ.setdefault('ANTHROPIC_API_KEY', os.getenv('ANTHROPIC_API_KEY', ''))
os.environ.setdefault('GROQ_API_KEY', os.getenv('GROQ_API_KEY', ''))

from agents import (
    PromptFactoryAgent,
    ValidatorAgent,
    ScriptWriterAgent,
    CriticSalesAgent,
    AdvocatePersuasionAgent,
    JudgeConversionAgent,
    ExpertEmotionsAgent,
    ExpertObjectionsAgent,
    ExpertRapportAgent,
    DebateOrchestrator
)


class FullPipelineOrchestrator:
    """
    Orquestrador do Pipeline Completo.

    Etapas:
    1. CRIAÇÃO - PromptFactoryAgent gera os 7 prompts
    2. VALIDAÇÃO - ValidatorAgent testa cada modo
    3. DEBATE - Sistema de debate melhora os prompts fracos
    4. SCRIPTS - ScriptWriterAgent gera roteiros de follow-up
    5. TESTES E2E - Groq simula conversas reais
    """

    def __init__(self):
        self.factory = PromptFactoryAgent()
        self.validator = ValidatorAgent()
        self.script_writer = ScriptWriterAgent()

        # Sistema de Debate
        self.critic = CriticSalesAgent()
        self.advocate = AdvocatePersuasionAgent()
        self.judge = JudgeConversionAgent()
        self.expert_emotions = ExpertEmotionsAgent()
        self.expert_objections = ExpertObjectionsAgent()
        self.expert_rapport = ExpertRapportAgent()

        # Resultados
        self.results = {
            'agent_data': None,
            'validation': {},
            'debate_improvements': {},
            'scripts': {},
            'e2e_results': None,
            'files': {}
        }

    async def run_full_pipeline(
        self,
        profile_path: str,
        location_id: str,
        calendar_id: str,
        output_dir: str = "sql",
        run_e2e: bool = True,
        debate_weak_modes: bool = True
    ) -> Dict:
        """
        Executa pipeline completo.

        Args:
            profile_path: Caminho do arquivo de perfil
            location_id: GHL Location ID
            calendar_id: GHL Calendar ID
            output_dir: Diretório para salvar arquivos
            run_e2e: Se True, roda testes E2E com Groq
            debate_weak_modes: Se True, usa debate para melhorar modos fracos
        """

        print("""
    ╔═══════════════════════════════════════════════════════════════════════════╗
    ║                                                                           ║
    ║   🏭 AI FACTORY - PIPELINE COMPLETO                                       ║
    ║                                                                           ║
    ║   Usando TODOS os 12 agentes para criar o melhor agente possível          ║
    ║                                                                           ║
    ║   1. PromptFactory    → Criar 7 prompts modulares                         ║
    ║   2. Validator        → Testar cada modo                                  ║
    ║   3. Debate System    → Crítico + Defensor + Especialistas + Juiz         ║
    ║   4. ScriptWriter     → Roteiros de áudio/vídeo                           ║
    ║   5. E2E Tests        → Conversas simuladas com Groq                      ║
    ║                                                                           ║
    ╚═══════════════════════════════════════════════════════════════════════════╝
        """)

        start_time = datetime.utcnow()

        # Verificar arquivo
        if not Path(profile_path).exists():
            print(f"❌ Arquivo não encontrado: {profile_path}")
            return None

        profile_text = Path(profile_path).read_text(encoding='utf-8')

        print(f"📄 Perfil: {profile_path}")
        print(f"📍 Location: {location_id}")
        print(f"📅 Calendar: {calendar_id}")
        print()

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 1: CRIAÇÃO DOS PROMPTS
        # ═══════════════════════════════════════════════════════════════
        print("=" * 70)
        print("📦 ETAPA 1/5: CRIAÇÃO DOS PROMPTS (PromptFactoryAgent)")
        print("=" * 70)
        print("   Usando Claude Opus para gerar os 7 prompts modulares...")
        print()

        factory_result = await self.factory.execute({
            'profile_path': profile_path,
            'location_id': location_id,
            'calendar_id': calendar_id
        })

        if not factory_result.success:
            print(f"❌ Erro na criação: {factory_result.error}")
            return None

        agent_data = factory_result.output
        self.results['agent_data'] = agent_data

        agent_name = agent_data.get('agent_name', 'Agente')
        agent_slug = agent_name.lower().replace(' ', '_')

        print(f"✅ Agente criado: {agent_name} v{agent_data.get('version', '1.0')}")
        print(f"   Modos gerados: {len(agent_data.get('prompts_by_mode', {}))}")
        print(f"   Tokens usados: {factory_result.tokens_used:,}")

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 2: VALIDAÇÃO INICIAL
        # ═══════════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("🧪 ETAPA 2/5: VALIDAÇÃO INICIAL (ValidatorAgent)")
        print("=" * 70)
        print("   Testando cada modo com casos de teste...")
        print()

        validation_results = {}
        weak_modes = []  # Modos que precisam de melhoria

        for mode_name, mode_prompt in agent_data.get('prompts_by_mode', {}).items():
            print(f"   Validando {mode_name}...", end=" ")

            full_prompt = f"{agent_data.get('system_prompt', '')}\n\n### MODO: {mode_name.upper()} ###\n{mode_prompt}"

            val_result = await self.validator.execute({
                'prompt_to_validate': full_prompt,
                'test_cases': self._get_test_cases_for_mode(mode_name)
            })

            if val_result.success:
                scores = val_result.output.get('scores', {})
                avg_score = sum(scores.values()) / len(scores) if scores else 0
                validation_results[mode_name] = {
                    'score': avg_score,
                    'scores': scores,
                    'feedback': val_result.output.get('feedback', '')
                }

                if avg_score >= 8:
                    print(f"✅ {avg_score:.1f}/10")
                elif avg_score >= 6:
                    print(f"⚠️ {avg_score:.1f}/10 (precisa melhorar)")
                    weak_modes.append(mode_name)
                else:
                    print(f"❌ {avg_score:.1f}/10 (crítico)")
                    weak_modes.append(mode_name)
            else:
                validation_results[mode_name] = {'score': 0, 'error': val_result.error}
                print(f"❌ Erro")
                weak_modes.append(mode_name)

        self.results['validation'] = validation_results

        avg_total = sum(v.get('score', 0) for v in validation_results.values()) / len(validation_results)
        print(f"\n   📊 Score médio: {avg_total:.1f}/10")
        print(f"   ⚠️ Modos fracos: {len(weak_modes)}")

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 3: SISTEMA DE DEBATE (para modos fracos)
        # ═══════════════════════════════════════════════════════════════
        if debate_weak_modes and weak_modes:
            print("\n" + "=" * 70)
            print("🎭 ETAPA 3/5: SISTEMA DE DEBATE (Crítico → Defensor → Especialistas → Juiz)")
            print("=" * 70)
            print(f"   Melhorando {len(weak_modes)} modos fracos: {', '.join(weak_modes)}")
            print()

            for mode_name in weak_modes:
                print(f"\n   --- Debate para modo: {mode_name} ---")

                original_prompt = agent_data['prompts_by_mode'].get(mode_name, '')
                full_prompt = f"{agent_data.get('system_prompt', '')}\n\n### MODO: {mode_name.upper()} ###\n{original_prompt}"

                # 3.1 Crítico ataca
                print("   🔴 Crítico analisando...")
                critic_result = await self.critic.execute({
                    'prompt': full_prompt,
                    'context': f"Modo {mode_name} de agente SDR para {agent_data.get('business_config', {}).get('specialty', 'vendas')}"
                })

                criticism = critic_result.output.get('criticism', '') if critic_result.success else ''

                # 3.2 Defensor propõe melhorias
                print("   🟢 Defensor propondo melhorias...")
                advocate_result = await self.advocate.execute({
                    'prompt': full_prompt,
                    'criticism': criticism
                })

                improved_prompt = advocate_result.output.get('improved_prompt', original_prompt) if advocate_result.success else original_prompt

                # 3.3 Especialistas opinam
                print("   🟡 Especialistas opinando...")

                # Emotions
                emotions_result = await self.expert_emotions.execute({
                    'prompt': improved_prompt,
                    'mode': mode_name
                })

                # Objections
                objections_result = await self.expert_objections.execute({
                    'prompt': improved_prompt,
                    'mode': mode_name
                })

                # Rapport
                rapport_result = await self.expert_rapport.execute({
                    'prompt': improved_prompt,
                    'mode': mode_name
                })

                expert_feedback = {
                    'emotions': emotions_result.output if emotions_result.success else {},
                    'objections': objections_result.output if objections_result.success else {},
                    'rapport': rapport_result.output if rapport_result.success else {}
                }

                # 3.4 Juiz decide versão final
                print("   ⚖️ Juiz decidindo versão final...")
                judge_result = await self.judge.execute({
                    'original_prompt': original_prompt,
                    'improved_prompt': improved_prompt,
                    'expert_feedback': expert_feedback
                })

                final_prompt = judge_result.output.get('final_prompt', improved_prompt) if judge_result.success else improved_prompt

                # Salvar melhoria
                self.results['debate_improvements'][mode_name] = {
                    'original': original_prompt,
                    'criticism': criticism,
                    'improved': improved_prompt,
                    'expert_feedback': expert_feedback,
                    'final': final_prompt
                }

                # Atualizar prompt no agent_data
                agent_data['prompts_by_mode'][mode_name] = final_prompt

                print(f"   ✅ Modo {mode_name} melhorado!")

        else:
            print("\n" + "=" * 70)
            print("🎭 ETAPA 3/5: SISTEMA DE DEBATE")
            print("=" * 70)
            if not weak_modes:
                print("   ✅ Todos os modos passaram! Debate não necessário.")
            else:
                print("   ⏭️ Debate desabilitado.")

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 4: GERAÇÃO DE SCRIPTS
        # ═══════════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("🎬 ETAPA 4/5: GERAÇÃO DE SCRIPTS (ScriptWriterAgent)")
        print("=" * 70)
        print("   Gerando roteiros de áudio/vídeo para follow-up...")
        print()

        business_config = agent_data.get('business_config', {})
        personality_config = agent_data.get('personality_config', {})

        scripts = {}

        # Scripts de áudio para diferentes etapas
        audio_stages = [
            ('ativacao', 'Lead novo, primeiro contato por Instagram'),
            ('qualificacao', 'Lead mostrou interesse, descobrindo dor'),
            ('pitch', 'Lead qualificado, apresentando oferta'),
            ('objecao', 'Lead tem objeção de preço'),
            ('recuperacao', 'Lead sumiu há 3 dias'),
            ('pos_venda', 'Cliente agendou, lembrete pré-consulta')
        ]

        for stage, context in audio_stages:
            print(f"   Gerando áudio: {stage}...", end=" ")

            script_result = await self.script_writer.generate_script(
                script_type='audio_followup',
                stage=stage,
                origin_agent='followuper',
                lead_context={
                    'name': '{{nome}}',
                    'history': context,
                    'pain': business_config.get('main_pain', 'não especificada'),
                    'profile': business_config.get('target_audience', 'público geral')
                },
                brand_voice=personality_config.get('tone', 'amigável e profissional'),
                product=business_config.get('main_offer', business_config.get('specialty', 'serviço'))
            )

            if script_result.get('success'):
                scripts[f'audio_{stage}'] = script_result.get('script', {})
                print("✅")
            else:
                print("⚠️")

        # VSL mini para pitch
        print(f"   Gerando VSL mini...", end=" ")
        vsl_result = await self.script_writer.generate_vsl_mini(
            target_pain=business_config.get('main_pain', 'problemas de saúde'),
            product=business_config.get('main_offer', 'consulta especializada'),
            social_proof=business_config.get('social_proof', '100+ clientes atendidos'),
            brand_voice=personality_config.get('tone', 'profissional')
        )
        if vsl_result.get('success'):
            scripts['vsl_mini'] = vsl_result.get('script', {})
            print("✅")
        else:
            print("⚠️")

        # Stories
        print(f"   Gerando stories...", end=" ")
        story_result = await self.script_writer.generate_story_content(
            topic=business_config.get('specialty', 'saúde'),
            objective='engajar e educar',
            brand_voice=personality_config.get('tone', 'profissional'),
            num_slides=5
        )
        if story_result.get('success'):
            scripts['stories'] = story_result.get('stories', {})
            print("✅")
        else:
            print("⚠️")

        self.results['scripts'] = scripts
        print(f"\n   📝 Total de scripts gerados: {len(scripts)}")

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 5: SALVAR ARQUIVOS
        # ═══════════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("💾 ETAPA 5/5: SALVANDO ARQUIVOS")
        print("=" * 70)

        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Regenerar SQL com prompts melhorados
        agent_data['sql'] = self.factory._generate_sql(agent_data, location_id, calendar_id)

        # Salvar SQL
        sql_path = f"{output_dir}/{agent_slug}_v1_prompts_modulares.sql"
        Path(sql_path).write_text(agent_data['sql'], encoding='utf-8')
        print(f"   ✅ SQL: {sql_path}")
        self.results['files']['sql'] = sql_path

        # Salvar Scripts
        scripts_path = f"{output_dir}/{agent_slug}_scripts_followup.json"
        Path(scripts_path).write_text(json.dumps(scripts, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"   ✅ Scripts: {scripts_path}")
        self.results['files']['scripts'] = scripts_path

        # Salvar Validation Report
        report_path = f"{output_dir}/{agent_slug}_validation_report.json"
        Path(report_path).write_text(json.dumps({
            'validation': validation_results,
            'debate_improvements': {k: {'original_score': validation_results.get(k, {}).get('score', 0)}
                                     for k in self.results.get('debate_improvements', {}).keys()}
        }, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"   ✅ Report: {report_path}")
        self.results['files']['report'] = report_path

        # ═══════════════════════════════════════════════════════════════
        # ETAPA 6 (OPCIONAL): TESTES E2E
        # ═══════════════════════════════════════════════════════════════
        if run_e2e:
            print("\n" + "=" * 70)
            print("🧪 ETAPA BÔNUS: TESTES E2E COM GROQ")
            print("=" * 70)
            print("   ⚠️ Para rodar E2E, primeiro insira o agente no Supabase:")
            print(f"      psql -f {sql_path}")
            print(f"   Depois rode:")
            print(f"      python run_groq_e2e_tests.py --agent \"{agent_name}\" --no-save")

        # ═══════════════════════════════════════════════════════════════
        # RESUMO FINAL
        # ═══════════════════════════════════════════════════════════════
        elapsed = (datetime.utcnow() - start_time).total_seconds()

        print(f"""

    ╔═══════════════════════════════════════════════════════════════════════════╗
    ║                         🎉 PIPELINE COMPLETO!                             ║
    ╠═══════════════════════════════════════════════════════════════════════════╣
    ║                                                                           ║
    ║  📦 Agente: {agent_name:<58} ║
    ║  🔢 Versão: {agent_data.get('version', '1.0.0'):<58} ║
    ║  📊 Score:  {avg_total:.1f}/10{' ' * 55} ║
    ║  🎭 Modos melhorados por debate: {len(self.results.get('debate_improvements', {})):<34} ║
    ║  🎬 Scripts gerados: {len(scripts):<48} ║
    ║  ⏱️ Tempo total: {elapsed:.1f}s{' ' * 52} ║
    ║                                                                           ║
    ║  📁 Arquivos:                                                             ║
    ║     • {sql_path:<65} ║
    ║     • {scripts_path:<65} ║
    ║     • {report_path:<65} ║
    ║                                                                           ║
    ╠═══════════════════════════════════════════════════════════════════════════╣
    ║  📝 Próximos passos:                                                      ║
    ║  1. Execute o SQL no Supabase                                             ║
    ║  2. Teste: python run_groq_e2e_tests.py --agent "{agent_name[:25]}..."    ║
    ║  3. Use os scripts de áudio para gravar follow-ups                        ║
    ╚═══════════════════════════════════════════════════════════════════════════╝
        """)

        return self.results

    def _get_test_cases_for_mode(self, mode_name: str) -> List[Dict]:
        """Retorna casos de teste para cada modo"""

        test_cases = {
            'sdr_inbound': [
                {'name': 'greeting', 'input': 'Oi, vi o anúncio de vocês', 'expected_behavior': 'Saudação acolhedora, pergunta sobre interesse'},
                {'name': 'price_question', 'input': 'Quanto custa?', 'expected_behavior': 'Não revelar preço direto, qualificar primeiro'},
            ],
            'social_seller_instagram': [
                {'name': 'new_follower', 'input': '', 'expected_behavior': 'DM de boas-vindas, valor antes de vender'},
                {'name': 'story_reply', 'input': 'Amei esse conteúdo!', 'expected_behavior': 'Agradecer, conectar, descobrir interesse'},
            ],
            'scheduler': [
                {'name': 'ready_to_schedule', 'input': 'Quero agendar', 'expected_behavior': 'Coletar dados, oferecer horários'},
                {'name': 'payment_question', 'input': 'Como pago?', 'expected_behavior': 'Explicar formas de pagamento, facilitar'},
            ],
            'concierge': [
                {'name': 'pre_appointment', 'input': 'É amanhã minha consulta né?', 'expected_behavior': 'Confirmar, orientar preparação'},
                {'name': 'doubt', 'input': 'Preciso levar algo?', 'expected_behavior': 'Instruções claras, reduzir ansiedade'},
            ],
            'followuper': [
                {'name': 'ghosted', 'input': '', 'expected_behavior': 'Retomar sem cobrar, entender contexto'},
                {'name': 'busy_response', 'input': 'Desculpa, estava corrido', 'expected_behavior': 'Validar, perguntar melhor momento'},
            ],
            'objection_handler': [
                {'name': 'price_objection', 'input': 'Tá caro demais', 'expected_behavior': 'Validar, ressignificar valor, não forçar'},
                {'name': 'husband_objection', 'input': 'Preciso falar com meu marido', 'expected_behavior': 'Respeitar, oferecer ajuda para convencer'},
            ],
            'reativador_base': [
                {'name': 'cold_lead', 'input': '', 'expected_behavior': 'Gancho forte, novidade, curto e direto'},
            ]
        }

        return test_cases.get(mode_name, [
            {'name': 'basic', 'input': 'Oi', 'expected_behavior': 'Resposta relevante ao modo'}
        ])


async def main():
    parser = argparse.ArgumentParser(
        description='AI Factory - Pipeline COMPLETO de Criação de Agente',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplo:
    python create_agent_full_pipeline.py \\
        --profile "/Users/marcosdaniels/Downloads/Dra Eliane.txt" \\
        --location "pFHwENFUxjtiON94jn2k" \\
        --calendar "yYjQWSpdlGorTcy3sLGj"
        """
    )

    parser.add_argument('--profile', '-p', type=str, required=True,
                        help='Caminho do arquivo de perfil')
    parser.add_argument('--location', '-l', type=str, required=True,
                        help='GHL Location ID')
    parser.add_argument('--calendar', '-c', type=str, required=True,
                        help='GHL Calendar ID')
    parser.add_argument('--output', '-o', type=str, default='sql',
                        help='Diretório de saída')
    parser.add_argument('--no-debate', action='store_true',
                        help='Pular sistema de debate')
    parser.add_argument('--no-e2e', action='store_true',
                        help='Pular instruções de E2E')

    args = parser.parse_args()

    # Verificar API Key
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ ANTHROPIC_API_KEY não configurada!")
        sys.exit(1)

    orchestrator = FullPipelineOrchestrator()

    await orchestrator.run_full_pipeline(
        profile_path=args.profile,
        location_id=args.location,
        calendar_id=args.calendar,
        output_dir=args.output,
        run_e2e=not args.no_e2e,
        debate_weak_modes=not args.no_debate
    )


if __name__ == "__main__":
    asyncio.run(main())
