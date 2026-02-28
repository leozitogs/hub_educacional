# 🚀 Guia de Deploy: Hub Inteligente de Recursos Educacionais

Este documento detalha o processo de implantação da arquitetura Full-Stack do projeto em ambiente de produção, utilizando uma topologia distribuída e otimizada para performance.

## 🏗️ Topologia da Infraestrutura
* **Banco de Dados:** Neon.tech (PostgreSQL Serverless)
* **Backend (API):** Render (Web Service / Python 3.11 / FastAPI)
* **Frontend (UI):** Vercel (React 18 / Vite / Framer Motion)

---

## Passo 1: Configuração do Banco de Dados (Neon.tech)

1. Crie um novo projeto no [Neon.tech](https://neon.tech/).
2. Copie a string de conexão (Connection Details).
3. **Ajuste Crítico de Driver (asyncpg):** O projeto utiliza SQLAlchemy com o driver assíncrono `asyncpg`. Este driver gerencia o SSL nativamente e não aceita parâmetros de conexão do driver padrão `libpq`.
   * **URL Original fornecida:** `postgresql://usuario:senha@host/banco?sslmode=require&channel_binding=require`
   * **URL Modificada para Produção:** `postgresql+asyncpg://usuario:senha@host/banco`
   *(Remova todos os parâmetros após o nome do banco para evitar o erro `TypeError: connect() got an unexpected keyword argument 'sslmode'`)*.

---

## Passo 2: Implantação do Backend (Render)

1. No [Render](https://render.com/), crie um novo **Web Service** conectado ao repositório do GitHub.
2. **Configurações Principais:**
   * **Root Directory:** `backend` *(Garante que o Render ignore os arquivos do frontend)*
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Variáveis de Ambiente (Environment Variables):**
   * `PYTHON_VERSION`: `3.11.0` *(Garante a compatibilidade com a biblioteca `pydantic-core` e evita falhas de build com versões experimentais do Python)*.
   * `DATABASE_URL`: `[URL_MODIFICADA_DO_NEON_AQUI]`
   * `GEMINI_API_KEY`: `[SUA_CHAVE_GOOGLE_AI_STUDIO]`
   * `GEMINI_MODEL`: `gemini-1.5-flash` (ou versão equivalente)
   * `CORS_ORIGINS`: `*` *(Temporário para testes, ou a URL final da Vercel para produção restrita)*
   * `DEBUG`: `false`

---

## Passo 3: Implantação do Frontend (Vercel)

1. Na [Vercel](https://vercel.com/), importe o repositório e crie um novo projeto.
2. **Configurações Principais:**
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`

3. **Configuração de API:**
   Para garantir que o proxy do Vite em desenvolvimento não conflite com o ambiente de produção, a configuração do Axios (`frontend/src/services/api.ts`) deve ser montada dinamicamente:
   ```typescript
   baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,