# 💰 Together Finanças (finhuedoug)

O **Together Finanças** é uma plataforma de gestão financeira inteligente projetada exclusivamente para o casal Huana e Douglas. O sistema combina uma interface moderna de dashboard com a potência da Inteligência Artificial para automatizar o registro de gastos através do Telegram.

## 🚀 Funcionalidades Principais

- **🤖 Integração Inteligente com Telegram:**
  - Envie mensagens de texto como *"Jantar 50 reais no Nubank"* ou fotos de cupons fiscais.
  - O sistema utiliza **Google Gemini AI** para extrair automaticamente: estabelecimento, valor, data, forma de pagamento e categoria.
  - Confirmação em tempo real diretamente no chat do bot.

- **📊 Dashboard Interativo:**
  - Visualização completa de gastos mensais e anuais.
  - Gráficos de distribuição por categoria e banco.
  - Controle de gastos individuais vs. gastos do casal.

- **🎮 Gamificação Financeira:**
  - Sistema de XP e Níveis para incentivar a disciplina financeira.
  - Conquistas desbloqueáveis (Achievements).
  - Controle de sequências (Streaks) para lançamentos diários.

- **💳 Gestão de Contas e Cartões:**
  - Suporte a múltiplos bancos e métodos de pagamento.
  - Gestão de parcelamentos automáticos.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions).
- **IA:** Google Gemini AI (gemini-2.5-flash / gemini-2.0-flash).
- **Integração:** Telegram Bot API.

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js instalado.
- Conta no Supabase.
- Chave de API do Google AI Studio (Gemini).
- Token de Bot do Telegram (BotFather).

### Variáveis de Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anonima
```

### Configuração do Bot (Supabase Secrets)
Para o Webhook do Telegram funcionar, configure os seguintes Secrets no Supabase:
- `TELEGRAM_BOT_TOKEN`: Token do seu bot.
- `GEMINI_API_KEY`: Sua chave do Google Gemini.
- `DEFAULT_TELEGRAM_USER_ID`: Seu UUID do Supabase (para vincular os gastos).
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para escrita no banco.

## 📦 Como rodar o projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/huanafigueredo/finhuedoug.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📝 Licença
Este projeto é de uso privado e pessoal do casal Huana e Douglas.

---
Desenvolvido com ❤️ para organizar o futuro.
