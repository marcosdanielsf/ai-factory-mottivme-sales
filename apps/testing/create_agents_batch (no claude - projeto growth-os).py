#!/usr/bin/env python3
"""
AI Factory - Criar Múltiplos Agentes (Batch Mode)
=================================================
Processa múltiplos clientes de uma vez a partir de:
- Pasta com arquivos de perfil
- Arquivo único com múltiplos clientes separados
- CSV/JSON com dados dos clientes

Uso:
    # Pasta com múltiplos arquivos .txt
    python create_agents_batch.py --folder "/pasta/com/perfis/"

    # Arquivo único com múltiplos clientes (separados por ---)
    python create_agents_batch.py --file "transcricao_call.txt" --split

    # CSV com dados
    python create_agents_batch.py --csv "clientes.csv"
"""

import asyncio
import argparse
import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# Configurar API Key
os.environ.setdefault('ANTHROPIC_API_KEY', os.getenv('ANTHROPIC_API_KEY', ''))

from agents.agent_12_prompt_factory import PromptFactoryAgent
from agents.agent_04_validator import ValidatorAgent
from agents.agent_11_script_writer import ScriptWriterAgent


class BatchProcessor:
    """Processa múltiplos clientes em batch"""

    def __init__(self, output_dir: str = "sql"):
        self.output_dir = output_dir
        self.factory = PromptFactoryAgent()
        self.validator = ValidatorAgent()
        self.script_writer = ScriptWriterAgent()
        self.results = []

    async def process_single(
        self,
        profile_text: str,
        location_id: str,
        calendar_id: str,
        client_name: str = None
    ) -> Dict:
        """Processa um único cliente"""

        print(f"\n{'='*60}")
        print(f"📦 Processando: {client_name or 'Cliente'}")
        print(f"{'='*60}")

        try:
            # 1. Criar agente
            print("   🔄 Gerando prompts...")
            result = await self.factory.execute({
                'profile_text': profile_text,
                'location_id': location_id,
                'calendar_id': calendar_id,
                'agent_name': client_name
            })

            if not result.success:
                return {
                    'client': client_name,
                    'success': False,
                    'error': result.error
                }

            agent_data = result.output
            agent_name = agent_data.get('agent_name', client_name or 'Agente')
            agent_slug = agent_name.lower().replace(' ', '_')

            print(f"   ✅ Agente criado: {agent_name}")

            # 2. Salvar SQL
            sql_path = f"{self.output_dir}/{agent_slug}_v1_prompts_modulares.sql"
            Path(self.output_dir).mkdir(parents=True, exist_ok=True)
            Path(sql_path).write_text(agent_data['sql'], encoding='utf-8')
            print(f"   💾 SQL: {sql_path}")

            # 3. Gerar scripts de follow-up
            print("   🎬 Gerando scripts...")
            scripts = await self._generate_scripts(agent_data)

            scripts_path = f"{self.output_dir}/{agent_slug}_scripts_followup.json"
            Path(scripts_path).write_text(
                json.dumps(scripts, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            print(f"   💾 Scripts: {scripts_path}")

            return {
                'client': client_name,
                'agent_name': agent_name,
                'success': True,
                'files': {
                    'sql': sql_path,
                    'scripts': scripts_path
                },
                'tokens': result.tokens_used
            }

        except Exception as e:
            return {
                'client': client_name,
                'success': False,
                'error': str(e)
            }

    async def _generate_scripts(self, agent_data: Dict) -> Dict:
        """Gera scripts de follow-up para um agente"""
        scripts = {}
        business_config = agent_data.get('business_config', {})
        personality_config = agent_data.get('personality_config', {})

        stages = ['ativacao', 'qualificacao', 'recuperacao']

        for stage in stages:
            try:
                script_result = await self.script_writer.generate_script(
                    script_type='audio_followup',
                    stage=stage,
                    origin_agent='followuper',
                    lead_context={
                        'name': '{{nome}}',
                        'pain': business_config.get('main_pain', ''),
                        'profile': business_config.get('target_audience', '')
                    },
                    brand_voice=personality_config.get('tone', 'amigável'),
                    product=business_config.get('main_offer', business_config.get('specialty', ''))
                )
                if script_result.get('success'):
                    scripts[stage] = script_result.get('script', {})
            except:
                pass

        return scripts

    async def process_folder(self, folder_path: str, default_location: str, default_calendar: str):
        """Processa todos os .txt de uma pasta"""

        folder = Path(folder_path)
        if not folder.exists():
            print(f"❌ Pasta não encontrada: {folder_path}")
            return

        txt_files = list(folder.glob("*.txt"))

        if not txt_files:
            print(f"❌ Nenhum arquivo .txt encontrado em: {folder_path}")
            return

        print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🏭 AI FACTORY - BATCH MODE                                  ║
    ║   Processando {len(txt_files)} clientes...                              ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
        """)

        for i, txt_file in enumerate(txt_files, 1):
            print(f"\n[{i}/{len(txt_files)}] {txt_file.name}")

            profile_text = txt_file.read_text(encoding='utf-8')
            client_name = txt_file.stem  # Nome do arquivo sem extensão

            result = await self.process_single(
                profile_text=profile_text,
                location_id=default_location,
                calendar_id=default_calendar,
                client_name=client_name
            )
            self.results.append(result)

        self._print_summary()

    async def process_split_file(
        self,
        file_path: str,
        separator: str = "---",
        default_location: str = "LOCATION_ID",
        default_calendar: str = "CALENDAR_ID"
    ):
        """
        Processa arquivo único com múltiplos clientes separados por delimitador.

        Formato esperado:
        ```
        CLIENTE: Nome do Cliente 1
        LOCATION: xxx (opcional)
        CALENDAR: yyy (opcional)

        [conteúdo do perfil 1]

        ---

        CLIENTE: Nome do Cliente 2

        [conteúdo do perfil 2]

        ---
        ```
        """

        file = Path(file_path)
        if not file.exists():
            print(f"❌ Arquivo não encontrado: {file_path}")
            return

        content = file.read_text(encoding='utf-8')

        # Separar por delimitador
        sections = re.split(rf'\n{separator}\n', content)
        sections = [s.strip() for s in sections if s.strip()]

        if len(sections) < 2:
            print(f"⚠️ Apenas {len(sections)} seção encontrada. Use '{separator}' para separar clientes.")
            print("   Processando como cliente único...")
            sections = [content]

        print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🏭 AI FACTORY - BATCH MODE (Split File)                     ║
    ║   Encontrados {len(sections)} clientes no arquivo                       ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
        """)

        for i, section in enumerate(sections, 1):
            # Extrair metadados do início da seção
            client_name, location_id, calendar_id, profile_text = self._parse_section(
                section, default_location, default_calendar, i
            )

            print(f"\n[{i}/{len(sections)}] {client_name}")

            result = await self.process_single(
                profile_text=profile_text,
                location_id=location_id,
                calendar_id=calendar_id,
                client_name=client_name
            )
            self.results.append(result)

        self._print_summary()

    def _parse_section(
        self,
        section: str,
        default_location: str,
        default_calendar: str,
        index: int
    ) -> tuple:
        """Extrai metadados de uma seção"""

        lines = section.split('\n')
        client_name = f"Cliente_{index}"
        location_id = default_location
        calendar_id = default_calendar
        profile_lines = []

        for line in lines:
            line_lower = line.lower().strip()

            if line_lower.startswith('cliente:'):
                client_name = line.split(':', 1)[1].strip()
            elif line_lower.startswith('location:') or line_lower.startswith('location_id:'):
                location_id = line.split(':', 1)[1].strip()
            elif line_lower.startswith('calendar:') or line_lower.startswith('calendar_id:'):
                calendar_id = line.split(':', 1)[1].strip()
            else:
                profile_lines.append(line)

        profile_text = '\n'.join(profile_lines).strip()

        return client_name, location_id, calendar_id, profile_text

    async def process_csv(self, csv_path: str):
        """
        Processa CSV com dados dos clientes.

        Colunas esperadas:
        - nome (obrigatório)
        - location_id (obrigatório)
        - calendar_id (obrigatório)
        - perfil_path OU perfil_texto (um dos dois)
        """
        import csv

        file = Path(csv_path)
        if not file.exists():
            print(f"❌ Arquivo não encontrado: {csv_path}")
            return

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        if not rows:
            print("❌ CSV vazio")
            return

        print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🏭 AI FACTORY - BATCH MODE (CSV)                            ║
    ║   Processando {len(rows)} clientes do CSV                           ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
        """)

        for i, row in enumerate(rows, 1):
            client_name = row.get('nome', f'Cliente_{i}')
            location_id = row.get('location_id', 'LOCATION_ID')
            calendar_id = row.get('calendar_id', 'CALENDAR_ID')

            # Perfil pode ser path ou texto direto
            if row.get('perfil_path'):
                profile_path = Path(row['perfil_path'])
                if profile_path.exists():
                    profile_text = profile_path.read_text(encoding='utf-8')
                else:
                    print(f"   ⚠️ Arquivo não encontrado: {row['perfil_path']}")
                    continue
            elif row.get('perfil_texto'):
                profile_text = row['perfil_texto']
            else:
                print(f"   ⚠️ Linha {i} sem perfil_path ou perfil_texto")
                continue

            print(f"\n[{i}/{len(rows)}] {client_name}")

            result = await self.process_single(
                profile_text=profile_text,
                location_id=location_id,
                calendar_id=calendar_id,
                client_name=client_name
            )
            self.results.append(result)

        self._print_summary()

    def _print_summary(self):
        """Imprime resumo do processamento"""

        success = [r for r in self.results if r.get('success')]
        failed = [r for r in self.results if not r.get('success')]
        total_tokens = sum(r.get('tokens', 0) for r in success)

        print(f"""

    ╔═══════════════════════════════════════════════════════════════╗
    ║                    📊 RESUMO BATCH                            ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║                                                               ║
    ║  ✅ Sucesso:  {len(success):<48} ║
    ║  ❌ Falhas:   {len(failed):<48} ║
    ║  🔢 Tokens:   {total_tokens:,}{' ' * (47 - len(f'{total_tokens:,}'))} ║
    ║                                                               ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║  📁 Arquivos gerados em: {self.output_dir}/                          ║
    ╚═══════════════════════════════════════════════════════════════╝
        """)

        if success:
            print("\n✅ Agentes criados:")
            for r in success:
                print(f"   • {r.get('agent_name', r.get('client'))}")
                if r.get('files'):
                    print(f"     SQL: {r['files'].get('sql')}")

        if failed:
            print("\n❌ Falhas:")
            for r in failed:
                print(f"   • {r.get('client')}: {r.get('error')}")


def main():
    parser = argparse.ArgumentParser(
        description='AI Factory - Criar Múltiplos Agentes (Batch)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Modos de uso:

  1. PASTA COM ARQUIVOS:
     python create_agents_batch.py --folder "/pasta/perfis/" --location "xxx" --calendar "yyy"
     (cada .txt vira um agente)

  2. ARQUIVO ÚNICO COM SEPARADOR:
     python create_agents_batch.py --file "call_transcricao.txt" --split
     (separa por '---' e cria um agente por seção)

  3. CSV COM DADOS:
     python create_agents_batch.py --csv "clientes.csv"
     (colunas: nome, location_id, calendar_id, perfil_path ou perfil_texto)

Formato do arquivo com separador (--split):

  CLIENTE: Nome do Cliente 1
  LOCATION: location_id_1
  CALENDAR: calendar_id_1

  [perfil/transcrição do cliente 1]

  ---

  CLIENTE: Nome do Cliente 2
  LOCATION: location_id_2
  CALENDAR: calendar_id_2

  [perfil/transcrição do cliente 2]
        """
    )

    # Modos de entrada
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--folder', '-d', type=str,
                             help='Pasta com arquivos .txt de perfil')
    input_group.add_argument('--file', '-f', type=str,
                             help='Arquivo único com múltiplos clientes')
    input_group.add_argument('--csv', type=str,
                             help='CSV com dados dos clientes')

    # Opções
    parser.add_argument('--split', '-s', action='store_true',
                        help='Separar arquivo por delimitador (usa com --file)')
    parser.add_argument('--separator', type=str, default='---',
                        help='Delimitador entre clientes (default: ---)')
    parser.add_argument('--location', '-l', type=str, default='LOCATION_ID',
                        help='Location ID padrão (GHL)')
    parser.add_argument('--calendar', '-c', type=str, default='CALENDAR_ID',
                        help='Calendar ID padrão (GHL)')
    parser.add_argument('--output', '-o', type=str, default='sql',
                        help='Diretório de saída')

    args = parser.parse_args()

    # Verificar API Key
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ ANTHROPIC_API_KEY não configurada!")
        sys.exit(1)

    # Processar
    processor = BatchProcessor(output_dir=args.output)

    if args.folder:
        asyncio.run(processor.process_folder(
            folder_path=args.folder,
            default_location=args.location,
            default_calendar=args.calendar
        ))
    elif args.file:
        if args.split:
            asyncio.run(processor.process_split_file(
                file_path=args.file,
                separator=args.separator,
                default_location=args.location,
                default_calendar=args.calendar
            ))
        else:
            # Arquivo único = um cliente
            asyncio.run(processor.process_single(
                profile_text=Path(args.file).read_text(encoding='utf-8'),
                location_id=args.location,
                calendar_id=args.calendar,
                client_name=Path(args.file).stem
            ))
    elif args.csv:
        asyncio.run(processor.process_csv(args.csv))


if __name__ == "__main__":
    main()
