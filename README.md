# Hub Inteligente de Recursos Educacionais

<p align="center">
  <strong>Autor: Leonardo Gonçalves Sobral</strong><br>
  <em>19 anos — Ciência da Computação — 3° Período</em>
</p>

---

## 1. Introdução

O **Hub Inteligente de Recursos Educacionais** é uma aplicação Fullstack moderna e sofisticada projetada para o gerenciamento centralizado de materiais didáticos. A plataforma permite que educadores e alunos cadastrem, organizem e acessem recursos como vídeos, PDFs e links, com o diferencial de um **Smart Assist** baseado em Inteligência Artificial (Google Gemini) que gera descrições pedagógicas e tags de categorização automaticamente.

O projeto foi construído com uma stack tecnológica de ponta, focando em performance, escalabilidade e uma experiência de usuário (UX) cinematográfica. A interface, inspirada no design da Apple, utiliza conceitos de **Glassmorphism** e **Liquid Glass** para criar um ambiente visualmente limpo e moderno, enquanto animações fluidas, orquestradas por **Framer Motion** e **anime.js**, guiam o usuário de forma intuitiva.

## 2. Demonstração

A seguir, capturas de tela que ilustram o funcionamento da aplicação:

### Tela Principal — Listagem de Recursos

<p align="center">
  <img src="Images/CapturaFuncionamento1.png" alt="Tela principal do Hub Educacional com listagem de recursos" width="800"/>
</p>

A tela principal exibe os recursos educacionais cadastrados, com busca por título, filtro por tipo e paginação. O indicador de status do **Gemini AI** é exibido no canto superior direito, confirmando que o serviço de IA está ativo.

### Cadastro de Novo Recurso — Geração com IA

<p align="center">
  <img src="Images/CaptureFuncionamento2.png" alt="Formulário de cadastro de recurso com geração de descrição por IA" width="800"/>
</p>

O formulário de cadastro de novo recurso permite ao usuário informar o título, tipo e URL do material. Ao clicar em **"Gerar Descrição com IA"**, o sistema utiliza o Google Gemini para gerar automaticamente uma descrição pedagógica e tags de categorização, como demonstrado pela notificação de sucesso na parte superior da tela.

## 3. Stack Tecnológica

A arquitetura do projeto é dividida em dois serviços principais: um backend RESTful e um frontend SPA (Single Page Application).

| Camada             | Tecnologia         | Descrição                                                                                             |
| :----------------- | :----------------- | :---------------------------------------------------------------------------------------------------- |
| **Frontend**       | **React 18**       | Biblioteca declarativa para construção de interfaces reativas.                                        |
|                    | **Vite**           | Build tool de alta performance com Hot Module Replacement (HMR) instantâneo.                          |
|                    | **TypeScript**     | Superset do JavaScript que adiciona tipagem estática para maior robustez.                             |
|                    | **Tailwind CSS**   | Framework CSS utility-first para design rápido e customizável.                                        |
|                    | **Framer Motion**  | Biblioteca de animação para React, utilizada para transições de UI baseadas em física (springs).      |
|                    | **anime.js**       | Engine de animação leve, usada para efeitos complexos e decorativos no background.                    |
|                    | **Axios**          | Cliente HTTP para comunicação com o backend, com interceptors para tratamento de erros.               |
| **Backend**        | **Python 3.11**    | Linguagem de programação principal, com foco em código moderno e legível.                             |
|                    | **FastAPI**        | Framework web de alta performance para construção de APIs, com validação de dados e docs automáticos. |
|                    | **Pydantic V2**    | Biblioteca para validação rigorosa de dados e gerenciamento de configurações (via `BaseSettings`).    |
|                    | **SQLAlchemy 2.0** | ORM assíncrono para interação com o banco de dados, utilizando o driver `asyncpg`.                    |
| **Banco de Dados** | **PostgreSQL**     | Banco de dados relacional robusto e escalável, com suporte a tipos avançados como `ARRAY`.            |
| **IA**             | **Google Gemini**  | Modelo de linguagem (LLM) utilizado para a funcionalidade "Smart Assist".                             |
| **DevOps**         | **GitHub Actions** | Plataforma de CI/CD para automação de linting, formatação e testes a cada push.                       |

## 4. Funcionalidades Principais

- **CRUD Completo de Recursos**: Crie, leia, atualize e exclua recursos educacionais com uma interface intuitiva.
- **Listagem Paginada com Filtros**: Navegue por centenas de recursos com paginação server-side, busca por título e filtro por tipo (Vídeo, PDF, Link).
- **Smart Assist (IA)**: Com um clique, gere automaticamente descrições pedagógicas e tags de categorização para seus recursos, utilizando o poder do Google Gemini.
- **Engenharia de Prompt Avançada**: O backend utiliza um System Prompt rigoroso que instrui a IA a atuar como um "Assistente Pedagógico", garantindo respostas consistentes e em formato JSON estrito.
- **UX/UI Cinematográfica**:
  - **Glassmorphism & Liquid Glass**: Interface moderna com efeitos de vidro fosco e gradientes suaves.
  - **Animações Baseadas em Física**: Transições de rotas, efeitos em cascata e microinterações responsivas orquestradas pelo Framer Motion, simulando sistemas massa-mola para movimentos naturais.
  - **Loading States Sofisticados**: Skeletons com efeito *shimmer* e spinners animados que fornecem feedback visual elegante durante operações assíncronas.
- **DevOps & Observabilidade**:
  - **CI/CD Pipeline**: GitHub Actions que rodam linters (`flake8`, `black`) e testes (`pytest`) a cada push.
  - **Logs Estruturados**: O backend registra interações com a IA, incluindo métricas de latência e uso de tokens, essenciais para monitoramento.
  - **Health Check**: Endpoint `/health` para verificação de disponibilidade do serviço.
- **Segurança**: Chaves de API são gerenciadas via variáveis de ambiente (`.env`) e nunca expostas no código-fonte.

## 5. Arquitetura e Decisões Técnicas

### Backend (FastAPI)

O backend foi estruturado seguindo o padrão **Service Layer**, que isola a lógica de negócio dos endpoints da API. Isso promove alta coesão, baixo acoplamento e facilita a testabilidade.

- **`main.py`**: Ponto de entrada da aplicação. Configura o FastAPI, middleware CORS, rotas e o ciclo de vida (lifespan) para inicialização do banco.
- **`core/`**: Contém a lógica fundamental da aplicação.
  - `config.py`: Gerencia configurações via Pydantic `BaseSettings`, carregando variáveis do arquivo `.env`.
  - `database.py`: Configura a conexão assíncrona com o PostgreSQL usando SQLAlchemy 2.0 e `asyncpg`.
  - `logging.py`: Implementa logging estruturado com um formatter customizado para logs legíveis e ricos em metadados.
- **`models/`**: Define os modelos ORM do SQLAlchemy. O modelo `Resource` utiliza tipos nativos do PostgreSQL como `ARRAY` para tags, otimizando queries.
- **`schemas/`**: Define os schemas de validação do Pydantic (DTOs). A validação rigorosa com `field_validator` garante a integridade dos dados na entrada e saída da API.
- **`services/`**: Contém a lógica de negócio.
  - `resource_service.py`: Implementa as operações CRUD de forma assíncrona.
  - `ai_service.py`: Encapsula a comunicação com a API do Google Gemini, incluindo a engenharia de prompt e o parsing robusto da resposta JSON.
- **`api/`**: Define os endpoints RESTful usando `APIRouter`. Cada endpoint delega a execução para o service correspondente.

### Frontend (React)

O frontend foi construído com foco em uma arquitetura de componentes reutilizáveis e gerenciamento de estado desacoplado.

- **`main.tsx`**: Ponto de entrada que renderiza a aplicação no DOM.
- **`App.tsx`**: Componente raiz que configura o `react-router-dom` para navegação e o `react-hot-toast` para notificações globais.
- **`pages/`**: Contém os componentes de página. `HomePage.tsx` orquestra todos os elementos da tela principal.
- **`components/`**: Componentes de UI reutilizáveis (`Header`, `ResourceCard`, `ResourceForm`, etc.).
- **`hooks/`**: Hooks customizados. `useResources.ts` encapsula toda a lógica de estado e comunicação com a API para o CRUD de recursos, incluindo paginação, filtros e debounce de busca.
- **`services/api.ts`**: Centraliza todas as chamadas à API usando uma instância configurada do Axios. Um interceptor de erro padroniza o tratamento de falhas.
- **`styles/globals.css`**: Define estilos globais e classes utilitárias do Tailwind CSS, incluindo as implementações de **Glassmorphism** e **Liquid Glass**.

#### A Física das Animações (Framer Motion & anime.js)

As animações foram projetadas para serem mais do que apenas decorativas; elas fornecem feedback e guiam o usuário de forma natural. Para isso, utilizamos duas bibliotecas com propósitos distintos:

1. **Framer Motion**: Usado para animações de UI que respondem ao estado do React. A maioria das animações utiliza `transition={{ type: 'spring' }}`. Isso simula um **sistema massa-mola** regido pela equação de um oscilador harmônico amortecido. Ao invés de definir duração e curva, controlamos a `stiffness` (rigidez da mola) e o `damping` (amortecimento), resultando em movimentos mais orgânicos e responsivos, como o "snap" suave de um modal ou o "bounce" sutil de um botão.

2. **anime.js**: Usado para animações complexas e performáticas que não precisam ser reativas ao estado do React, como os **orbs decorativos no background**. O anime.js manipula o DOM diretamente, sendo ideal para animações contínuas e em loop. A animação dos orbs utiliza uma combinação de translação 2D e escala com easing senoidal (`easeInOutSine`), simulando um movimento de flutuação natural e hipnótico.

## 6. Setup e Execução Local

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- **Node.js** (v18 ou superior)
- **Python** (v3.10 ou superior)
- **PostgreSQL** (v12 ou superior)
- **Git**

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/hub-educacional.git
cd hub-educacional
```

### 2. Configurar o Backend

1. **Navegue até o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Crie e ative um ambiente virtual:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # No Windows: .venv\Scripts\activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente:**
   Copie o arquivo de exemplo e edite-o com suas configurações.
   ```bash
   cp .env.example .env
   ```
   Abra o arquivo `.env` e configure `DATABASE_URL` e `GEMINI_API_KEY`:
   - **`DATABASE_URL`**: String de conexão do seu PostgreSQL. Exemplo: `postgresql+asyncpg://usuario:senha@localhost:5432/hub_educacional`.
   - **`GEMINI_API_KEY`**: Sua chave da API do Google Gemini. Obtenha em [Google AI Studio](https://aistudio.google.com/apikey).

5. **Crie o banco de dados no PostgreSQL:**
   Use seu cliente PostgreSQL preferido (psql, DBeaver, etc.) para criar um novo banco de dados com o nome definido em `DATABASE_URL` (ex: `hub_educacional`).

6. **Inicie o servidor backend:**
   ```bash
   uvicorn app.main:app --reload
   ```
   O servidor estará rodando em `http://localhost:8000`. A documentação interativa da API estará disponível em `http://localhost:8000/docs`.

### 3. Configurar o Frontend

1. **Navegue até o diretório do frontend (em um novo terminal):**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:5173`. O Vite irá redirecionar automaticamente as chamadas de API para o backend na porta 8000.

## 7. Documentação da API

Os endpoints da API REST estão disponíveis sob o prefixo `/api/v1`.

| Método   | Endpoint           | Descrição                                |
| :------- | :----------------- | :--------------------------------------- |
| `GET`    | `/resources`       | Lista recursos com paginação e filtros.  |
| `GET`    | `/resources/{id}`  | Obtém um recurso específico pelo ID.     |
| `POST`   | `/resources`       | Cria um novo recurso educacional.        |
| `PUT`    | `/resources/{id}`  | Atualiza um recurso existente.           |
| `DELETE` | `/resources/{id}`  | Exclui um recurso.                       |
| `POST`   | `/ai/generate`     | Gera descrição e tags com IA.            |
| `GET`    | `/health`          | Endpoint de Health Check.                |

Para detalhes completos sobre os schemas de requisição e resposta, acesse a documentação interativa do Swagger UI em `http://localhost:8000/docs` com o backend em execução.

---

<p align="center">
  <strong>Desenvolvido com 💙 por Leonardo Gonçalves Sobral</strong>
</p>
