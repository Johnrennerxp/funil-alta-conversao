# 🚀 LeadFunnel Pro — Sistema de Qualificação e Alta Conversão (Zero-Trust)

Aplicação Web completa desenvolvida em **React + Vite + Tailwind CSS + Lucide Icons**, arquitetada como uma **Single Page Application (SPA)** 100% compatível com hospedagem estática no **GitHub Pages** (utilizando `base: './'` e `HashRouter` com rotas `#/f/slug-do-funil` para prevenir erros 404 em links diretos).

---

## 📊 Geração de Planilhas Automática por Formulário

Cada formulário armazena todas as respostas dos leads em tempo real:
1. **Exportação Direta no Painel (CSV / Excel):**
   - Na aba **Planilhas** ou diretamente no card de cada funil na aba **Funis**, clique em **Planilha (CSV/Excel)**.
   - O arquivo é gerado com formatação **UTF-8 BOM**, garantindo abertura perfeita no Microsoft Excel no Windows com acentos e caracteres em português.
   - Colunas organizadas: Data e Hora, Status (Qualificado / Desqualificado), cada pergunta em uma coluna individual, e os parâmetros de tráfego (`utm_source`, `utm_campaign`, `utm_medium`, `utm_content`, `utm_term`, `fbclid`).
2. **Alimentação do Google Sheets em Tempo Real (Webhook Gratuito):**
   - Disponibilizamos o código de **Google Apps Script** pronto para colar no seu Google Sheets (em *Extensões > Apps Script*).
   - Ao colar a URL gerada no campo de Webhook do formulário, cada resposta nova cria automaticamente uma nova linha na sua planilha do Google Drive em tempo real e sem nenhum custo de mensalidade.

---

## 🛡️ Arquitetura de Segurança Zero-Trust

- **Zero Hardcoding:** Nenhum e-mail de administrador, telefone de WhatsApp, token ou chave de API fica exposto no código-fonte (`src/`).
- **Variáveis de Ambiente:** Todas as credenciais do Firebase são injetadas exclusivamente via variáveis `VITE_FIREBASE_*`.
- **Validação Server-Side no Firestore (`firestore.rules`):**
  - `authorized_users`: O próprio e-mail verificado é o ID do documento. Somente admins podem ler ou alterar.
  - `public_forms`: Leitura aberta para visitantes; criação/edição restrita a admins.
  - `form_analytics`: Registro de métricas anônimas (create: true; read/delete: admin).
  - `form_submissions`: Registro seguro das respostas dos clientes (create: true; read/delete: admin; update: false).

---

## 📋 Passo a Passo: Configuração do Firebase (Plano Spark Gratuito)

### 1. Criar o Projeto no Firebase Console
1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto.
2. Registre um app Web (`</>`) e copie as chaves para o seu `.env.local` ou nos **GitHub Secrets**.

### 2. Ativar Autenticação via Google
1. Vá em **Build > Authentication > Sign-in method**.
2. Ative o provedor **Google** e salve.

### 3. Ativar Firestore e Aplicar as Regras
1. Vá em **Build > Firestore Database** e crie o banco em modo de produção.
2. Na aba **Regras** (Rules), cole o conteúdo do arquivo `firestore.rules` da raiz do projeto e clique em **Publicar**.

### 4. Cadastrar o Primeiro Administrador
1. Na aba **Dados** (Data) do Firestore, inicie a coleção `authorized_users`.
2. Como **ID do documento**, coloque **exatamente o seu e-mail Google** (ex: `seu-email@gmail.com`).
3. Adicione o campo `addedBy: 'Console Manual'` e salve.

---

## 🚀 Deploy no GitHub Pages
1. No seu repositório GitHub, acesse **Settings > Secrets and variables > Actions** e cadastre as variáveis `VITE_FIREBASE_*`.
2. Em **Settings > Pages**, selecione **GitHub Actions**.
3. Faça o commit e push para a branch `main`. O workflow `.github/workflows/deploy.yml` fará o build e o deploy automaticamente!
