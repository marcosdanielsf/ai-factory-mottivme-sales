# COMO PERSONALIZAR A LANDING PAGE

> Guia rápido para adaptar o template para cada clínica

---

## PASSO 1: Copiar o arquivo

```bash
cp landing-page-clinica.html [nome-da-clinica].html
```

---

## PASSO 2: Substituir os campos

Procure e substitua todos os textos entre `[COLCHETES]`:

### Informações do Médico

| Campo | Exemplo |
|-------|---------|
| `[NOME]` | Dr. João Silva |
| `[ESPECIALIDADE]` | Cardiologista |
| `[NÚMERO]` (CRM) | 123456 |
| `[UNIVERSIDADE]` | USP |
| `[HOSPITAL]` | Hospital das Clínicas |

### Contato

| Campo | Exemplo |
|-------|---------|
| `[DDD]` | 11 |
| `[NUMERO]` | 99999-9999 |
| `[EMAIL]` | contato@clinica.com.br |
| `[RUA]` | Av. Paulista |
| `[BAIRRO]` | Bela Vista |
| `[CIDADE]` | São Paulo |
| `[UF]` | SP |
| `[CEP]` | 01310-100 |

### Estatísticas (Hero)

| Campo | Exemplo |
|-------|---------|
| `+[X]` Anos de experiência | +15 |
| `+[X]` Pacientes atendidos | +5.000 |
| `[X]%` Satisfação | 98% |

### Serviços/Especialidades

Substituir `[SERVIÇO 1]` até `[SERVIÇO 6]` pelos serviços oferecidos.

**Exemplos por especialidade:**

**Cardiologia:**
- Consulta Cardiológica
- Eletrocardiograma
- Teste Ergométrico
- Holter 24h
- MAPA
- Check-up Cardíaco

**Dermatologia:**
- Consulta Dermatológica
- Tratamento de Acne
- Botox e Preenchimento
- Peeling
- Laser
- Dermatoscopia

**Ortopedia:**
- Consulta Ortopédica
- Tratamento de Coluna
- Lesões Esportivas
- Infiltração
- Fisioterapia
- Cirurgia Ortopédica

---

## PASSO 3: Substituir imagens

As imagens estão com URLs do Unsplash (placeholder). Substituir por fotos reais:

1. **Hero (foto principal):** Foto do médico ou fachada da clínica
2. **Sobre:** Foto profissional do médico
3. **Depoimentos:** Fotos dos pacientes (ou remover)

**Tamanhos recomendados:**
- Hero: 600x700px
- Sobre: 600x700px
- Avatares: 100x100px

---

## PASSO 4: Conectar formulário ao GHL

1. No GHL, vá em **Sites > Forms**
2. Crie um novo formulário ou use existente
3. Copie a **URL de submissão** do formulário
4. Substitua `[URL_FORMULARIO_GHL]` pela URL copiada

**Campos do formulário mapeados:**
- `full_name` → Nome
- `phone` → Telefone
- `email` → E-mail
- `convenio` → Custom Field "Convênio"
- `message` → Observações
- `source` → Origem (já preenchido como "landing-page")

---

## PASSO 5: Personalizar cores (opcional)

No início do CSS, altere as variáveis:

```css
:root {
    --primary: #0D6EFD;        /* Azul - cor principal */
    --primary-dark: #0B5ED7;   /* Azul escuro - hover */
    --secondary: #198754;       /* Verde - sucesso */
    --accent: #20C997;          /* Verde água - destaque */
}
```

**Sugestões de cores por especialidade:**

| Especialidade | Primary | Secondary |
|--------------|---------|-----------|
| Cardiologia | #DC3545 (vermelho) | #198754 |
| Dermatologia | #E91E8C (rosa) | #20C997 |
| Pediatria | #FFC107 (amarelo) | #198754 |
| Ortopedia | #0D6EFD (azul) | #6C757D |
| Psiquiatria | #6F42C1 (roxo) | #20C997 |

---

## PASSO 6: Atualizar convênios

No formulário e no FAQ, atualizar lista de convênios aceitos:

```html
<select id="convenio" name="convenio">
    <option value="">Selecione...</option>
    <option value="particular">Particular</option>
    <option value="unimed">Unimed</option>
    <!-- Adicionar outros convênios -->
</select>
```

---

## PASSO 7: Configurar WhatsApp

Substituir em 3 lugares:
1. Botão do Hero
2. Botão do CTA
3. Botão flutuante (canto inferior direito)

**Formato:**
```
https://wa.me/55[DDD][NUMERO]?text=Olá! Gostaria de agendar uma consulta.
```

**Exemplo:**
```
https://wa.me/5511999999999?text=Olá! Gostaria de agendar uma consulta.
```

---

## PASSO 8: Upload e publicação

### Opção A: Usar no GHL Funnels
1. No GHL, vá em **Sites > Funnels**
2. Crie novo funil
3. Adicione página com **Custom Code**
4. Cole o HTML completo

### Opção B: Hospedar externamente
1. Faça upload para Vercel, Netlify ou servidor
2. Configure domínio personalizado
3. Aponte para o arquivo HTML

### Opção C: Usar como referência
1. Recrie o design no editor do GHL
2. Use as seções como guia
3. Copie os textos já prontos

---

## CHECKLIST FINAL

- [ ] Nome do médico substituído
- [ ] CRM e especialidade corretos
- [ ] Endereço completo
- [ ] Telefone/WhatsApp funcionando
- [ ] Fotos reais adicionadas
- [ ] Serviços corretos para a especialidade
- [ ] Depoimentos reais (ou removidos)
- [ ] Convênios atualizados
- [ ] Formulário conectado ao GHL
- [ ] Links de redes sociais funcionando
- [ ] Testado em mobile

---

## SUPORTE

Dúvidas sobre personalização? Consulte:
- Documentação GHL: https://help.gohighlevel.com
- CLAUDE.md da vertical médica

---

*Versão: 1.0*
*Data: 2026-01-16*
