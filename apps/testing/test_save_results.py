"""
AI Factory - Test com Salvamento de Resultados
===============================================
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from agents import SalesAnalyzerAgent, PromptGeneratorAgent, ValidatorAgent

RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)


async def main():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    all_results = {}

    # ========== TESTE 1: SalesAnalyzer ==========
    print("Executando SalesAnalyzer...")

    mock_input = {
        'contact_data': {
            'name': 'Maria Silva',
            'phone': '+5511999999999',
            'email': 'maria@email.com',
            'source': 'Instagram',
            'tags': ['lead', 'menopausa']
        },
        'conversation_data': {
            'messages': [
                {'role': 'user', 'content': 'Oi, vi o post sobre menopausa'},
                {'role': 'assistant', 'content': 'Olá! Que bom que nos procurou. O que mais chamou sua atenção?'},
                {'role': 'user', 'content': 'Estou tendo ondas de calor terríveis, já 2 anos assim'},
                {'role': 'assistant', 'content': 'Entendo como isso pode ser desconfortável. Você já tentou algum tratamento?'},
                {'role': 'user', 'content': 'Já tentei chás e suplementos, mas nada resolve'},
                {'role': 'assistant', 'content': 'A reposição hormonal bioidêntica costuma ter ótimos resultados. Gostaria de saber mais sobre nossa consulta?'},
                {'role': 'user', 'content': 'Sim, quanto custa?'},
                {'role': 'assistant', 'content': 'A consulta é R$971, com duração de 1h30. Temos opções de parcelamento.'},
                {'role': 'user', 'content': 'Ok, preciso falar com meu marido primeiro'},
            ]
        }
    }

    agent = SalesAnalyzerAgent()
    result = await agent.execute(mock_input)

    all_results['sales_analyzer'] = {
        'success': result.success,
        'output': result.output,
        'tokens': result.tokens_used,
        'time_ms': result.execution_time_ms
    }
    print(f"  -> Score: {result.output.get('score_total')}/100, Classificação: {result.output.get('classification')}")

    # ========== TESTE 2: PromptGenerator ==========
    print("Executando PromptGenerator...")

    mock_input2 = {
        'business_config': {
            'company_name': 'Instituto Amare',
            'service': 'Medicina Integrativa - Saúde Feminina',
            'ticket': 'R$ 971 (consulta) a R$ 50.000 (tratamentos)',
            'target_audience': 'Mulheres 40+, alta renda, empresárias',
            'addresses': 'Balneário Camboriú e Florianópolis',
            'hours': 'Segunda a Sexta, 9h-18h',
            'consultation_price': 'R$ 971',
            'calendar_link': 'https://instituto-amare.com/agendar',
            'differentials': '- Dra. Ana Paula: Especialista em hormônios bioidênticos\n- Mais de 500 pacientes tratadas',
        },
        'agent_name': 'Julia',
        'sales_analysis': result.output  # Usar resultado do teste anterior
    }

    agent2 = PromptGeneratorAgent()
    result2 = await agent2.execute(mock_input2)

    all_results['prompt_generator'] = {
        'success': result2.success,
        'output': result2.output,
        'tokens': result2.tokens_used,
        'time_ms': result2.execution_time_ms
    }
    print(f"  -> Prompt gerado: {len(result2.output.get('system_prompt', ''))} caracteres")

    # ========== TESTE 3: Validator ==========
    print("Executando ValidatorAgent...")

    mock_input3 = {
        'system_prompt': result2.output.get('system_prompt', ''),
        'agent_name': 'Julia',
        'test_cases': [
            {'name': 'Saudação', 'input': 'Oi', 'expected_behavior': 'Saudação acolhedora'},
            {'name': 'Preço', 'input': 'Quanto custa?', 'expected_behavior': 'Âncora valor'},
        ],
        'threshold': 7.0
    }

    agent3 = ValidatorAgent()
    result3 = await agent3.execute(mock_input3)

    all_results['validator'] = {
        'success': result3.success,
        'output': result3.output,
        'tokens': result3.tokens_used,
        'time_ms': result3.execution_time_ms
    }
    print(f"  -> Score: {result3.output.get('overall_score')}/10, Status: {result3.output.get('approval_status')}")

    # ========== SALVAR RESULTADOS ==========
    output_file = RESULTS_DIR / f"test_results_{timestamp}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Resultados salvos em: {output_file}")

    # Resumo
    print("\n" + "="*50)
    print("RESUMO DOS TESTES")
    print("="*50)
    print(f"SalesAnalyzer: {result.output.get('classification')} ({result.output.get('score_total')}/100)")
    print(f"PromptGenerator: {len(result2.output.get('system_prompt', ''))} chars")
    print(f"Validator: {result3.output.get('overall_score')}/10 - {result3.output.get('approval_status')}")
    print(f"\nTokens totais: {result.tokens_used + result2.tokens_used + result3.tokens_used}")
    print(f"Tempo total: {(result.execution_time_ms + result2.execution_time_ms + result3.execution_time_ms)/1000:.1f}s")

    return output_file


if __name__ == "__main__":
    asyncio.run(main())
