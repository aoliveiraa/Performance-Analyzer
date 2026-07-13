# Performance Analyzer

## 1. Visão geral

O **Performance Analyzer** é uma aplicação web criada para apoiar a análise de testes de performance.

A aplicação permite:

- subir arquivos CSV de **Load**;
- subir arquivos CSV de **Counters**;
- organizar os arquivos por **execução/run**;
- consolidar vários arquivos de diferentes hardwares em um único relatório;
- calcular métricas por **Action + Hardware**;
- comparar resultados com KPIs cadastrados em banco SQLite;
- indicar status **PASS**, **FAIL** ou **NO KPI**;
- visualizar relatórios, análise de memory leak e gráficos no dashboard.

---

## 2. Tecnologias usadas

### Backend

- Python
- FastAPI
- Uvicorn
- Pandas
- SQLite

### Frontend

- React
- Vite
- Material UI
- Apache ECharts / echarts-for-react
- Axios

---

## 3. Estrutura principal do projeto

Estrutura atual esperada:

```text
Performance-Analyzer/
│
├── app/
│   ├── main.py
│   ├── load_parser.py
│   ├── counters_parser.py
│   ├── report_generator.py
│   ├── chart_service.py
│   ├── run_service.py
│   ├── run_files_service.py
│   ├── kpi_service.py
│   └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── Dashboard.jsx
│   │   ├── components/
│   │   │   ├── ActionTrendChart.jsx
│   │   │   ├── MemoryTrendChart.jsx
│   │   │   ├── UploadFilesPanel.jsx
│   │   │   └── RunUploadPanel.jsx
│   │   └── services/
│   │       └── api.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── uploads/
│
└── performance_analyzer.db
```

---

## 4. Como rodar o projeto

### 4.1. Rodar o backend

Abra um terminal em modo PowerShell ou Prompt de Comando.

Entre na raiz do projeto:

```powershell
cd C:\Git\Performance-Analyzer
```

Execute o backend:

```powershell
python -m uvicorn app.main:app --reload
```

Backend esperado:

```text
http://127.0.0.1:8000
```

Swagger/API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

Resultado esperado:

```json
{
  "status": "UP"
}
```

---

### 4.2. Rodar o frontend

Abra um segundo terminal.

Entre na pasta do frontend:

```powershell
cd C:\Git\Performance-Analyzer\frontend
```

Instale as dependências, se necessário:

```powershell
npm install
```

Execute o frontend:

```powershell
npm run dev
```

Frontend esperado:

```text
http://localhost:5173
```

Se a porta 5173 estiver ocupada, o Vite pode abrir em outra porta, por exemplo:

```text
http://localhost:5174
```

Nesse caso, o backend precisa liberar essa porta no CORS dentro do arquivo `app/main.py`.

---

## 5. Dependências importantes do frontend

Caso apareça erro de dependência, execute:

```powershell
cd C:\Git\Performance-Analyzer\frontend
npm install
npm install tslib
npm install echarts echarts-for-react
npm install @mui/icons-material
```

Depois rode novamente:

```powershell
npm run dev
```

---

## 6. Fluxos disponíveis atualmente

### 6.1. Fluxo simples/padrão

Este fluxo usa arquivos fixos:

```text
uploads/load.csv
uploads/counters.csv
```

Endpoints principais:

```text
POST /upload-load
POST /upload-counters
GET  /dashboard/full
GET  /reports/actions
GET  /reports/counters
GET  /reports/memory-leaks
GET  /charts/action-trend
GET  /charts/memory-trend
```

Esse fluxo é útil para testes rápidos, mas sobrescreve os arquivos anteriores.

---

### 6.2. Fluxo por execução/run

Este é o fluxo principal do projeto.

A ideia é:

```text
1 execução/run = vários arquivos Load + vários arquivos Counters
```

Exemplo de estrutura gerada:

```text
uploads/
└── run_003/
    ├── load/
    │   ├── hardware_01_load.csv
    │   ├── hardware_02_load.csv
    │   └── hardware_03_load.csv
    │
    └── counters/
        ├── hardware_01_counters.csv
        ├── hardware_02_counters.csv
        └── hardware_03_counters.csv
```

Endpoints principais:

```text
POST /runs/create
GET  /runs
GET  /runs/{run_id}/files
POST /runs/{run_id}/upload/load-file
POST /runs/{run_id}/upload/counters-file
GET  /dashboard/{run_id}
GET  /reports/actions/{run_id}
GET  /reports/counters/{run_id}
GET  /reports/memory-leaks/{run_id}
```

Importante: o upload múltiplo pela tela envia os arquivos um por um para os endpoints:

```text
/runs/{run_id}/upload/load-file
/runs/{run_id}/upload/counters-file
```

Isso foi escolhido porque o Swagger estava interpretando upload múltiplo como `array<string>` em vez de arquivo.

---

## 7. Regras do relatório de Actions

O relatório de Actions é consolidado por:

```text
Hardware + Action
```

As colunas principais são:

```text
Hardware
Action
KPI
Total Quantity
Above KPI
Min
Max
Average
Std Deviation
50th Percentil
90th Percentil
Status
```

Os valores permanecem em **milissegundos**.

---

## 8. Regra de PASS/FAIL

A regra correta do projeto é baseada no **90th Percentil**, não na média.

```text
90th Percentil <= KPI  => PASS
90th Percentil > KPI   => FAIL
Sem KPI cadastrado     => NO KPI
```

Exemplo:

```text
KPI = 2000 ms
90th Percentil = 1380 ms
Status = PASS
```

Outro exemplo:

```text
KPI = 2000 ms
90th Percentil = 2500 ms
Status = FAIL
```

---

## 9. KPIs

Os KPIs são salvos em banco SQLite no arquivo:

```text
performance_analyzer.db
```

Tabela usada:

```text
kpis
```

Campos principais:

```text
action_name
kpi_ms
```

Endpoints de KPI:

```text
GET  /kpis
POST /kpis?action_name=Exact Cash&kpi_ms=2000
```

Também existe uma área no Dashboard chamada **KPI Management**, onde é possível:

- selecionar uma Action;
- informar KPI em milissegundos;
- salvar ou atualizar o KPI;
- atualizar automaticamente o relatório.

---

## 10. Funcionalidades já implementadas no frontend

Atualmente o Dashboard possui:

- cards de resumo;
- relatório de performance por Action;
- agrupamento por Action;
- múltiplos hardwares por Action;
- cálculo de PASS/FAIL vindo do backend;
- cadastro e edição de KPIs;
- upload simples de Load e Counters;
- criação/seleção de Runs;
- upload múltiplo de Load e Counters por Run;
- lista de arquivos enviados na Run;
- Resource Consumption Report;
- Memory Leak Analysis;
- gráficos de Action Response Trend e Memory Consumption Trend.

---

## 11. Como usar o sistema hoje

### Passo 1 — Iniciar backend

```powershell
cd C:\Git\Performance-Analyzer
python -m uvicorn app.main:app --reload
```

### Passo 2 — Iniciar frontend

```powershell
cd C:\Git\Performance-Analyzer\frontend
npm run dev
```

### Passo 3 — Acessar a tela

```text
http://localhost:5173
```

### Passo 4 — Criar uma execução/run

Na seção **Runs Management**:

1. clicar em **Create New Run**;
2. selecionar a run criada;
3. selecionar vários arquivos de Load CSV;
4. clicar em **Upload Load Files**;
5. selecionar vários arquivos de Counters CSV;
6. clicar em **Upload Counters Files**.

### Passo 5 — Conferir o relatório

Após o upload, o Dashboard deve consolidar os dados da execução selecionada.

O relatório deve mostrar:

```text
Action: Exact Cash
  Hardware 1
  Hardware 2
  Hardware 3
```

E assim por diante para as demais actions.

### Passo 6 — Cadastrar KPIs

Na seção **KPI Management**:

1. selecionar a Action;
2. informar KPI em ms;
3. clicar em **Save KPI**;
4. conferir se o status foi recalculado.

---

## 12. Problemas comuns e soluções

### Problema: `ModuleNotFoundError: No module named 'app'`

Causa provável: backend iniciado de dentro da pasta `app`.

Solução: executar a partir da raiz do projeto:

```powershell
cd C:\Git\Performance-Analyzer
python -m uvicorn app.main:app --reload
```

---

### Problema: frontend carrega infinitamente

Possíveis causas:

- backend não está rodando;
- endpoint retornou erro 500;
- CORS bloqueando porta 5174;
- arquivos `load.csv` ou `counters.csv` não existem ainda.

Verificações:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```

---

### Problema: erro `tslib`

Solução:

```powershell
cd C:\Git\Performance-Analyzer\frontend
npm install tslib
npm run dev
```

---

### Problema: erro com ícones do Material UI

Solução:

```powershell
cd C:\Git\Performance-Analyzer\frontend
npm install @mui/icons-material
npm run dev
```

---

### Problema: `.str.contains()` com valores float/NaN

Causa: colunas de texto em `counters_parser.py` podem vir com valores `NaN` ou numéricos.

Correção esperada no parser:

```python
df["CounterName"] = df["CounterName"].fillna("").astype(str)
df["ProcessName"] = df["ProcessName"].fillna("").astype(str)
```

---

## 13. Próxima organização planejada

A nova estrutura de telas planejada é:

1. **Tela Principal — Reports Home**
   - lista todas as execuções/relatórios já criados;
   - permite abrir um relatório específico.

2. **Tela de Resumo do Relatório — Report Summary**
   - mostra um resumo consolidado por Action;
   - calcula médias/estatísticas consolidadas das colunas;
   - mostra uma visão executiva parecida com o print de referência.

3. **Visualização Expandida — Hardware Details**
   - botão para expandir e visualizar os resultados por hardware;
   - mostra a tabela detalhada atual.

4. **Página de Gráficos — Charts Page**
   - gráficos em uma página separada;
   - acesso por botão a partir do relatório.

5. **Página de Upload — Upload Run Files**
   - criação/seleção de execução/run;
   - upload de vários Load CSVs;
   - upload de vários Counters CSVs.

6. **Página de KPIs — KPI Management**
   - cadastro e edição de KPIs em tela separada;
   - acesso pela tela principal.

---

## 14. Status atual do projeto

Status atual: **funcional em modo dashboard único**, com uploads e runs funcionando.

Principais entregas já concluídas:

- backend FastAPI estruturado;
- frontend React/Vite funcionando;
- upload simples e upload por run funcionando;
- suporte a múltiplos arquivos por execução;
- relatório consolidado por Action + Hardware;
- KPIs salvos em SQLite;
- PASS/FAIL baseado no 90th Percentil;
- Dashboard com tabelas, KPIs, memory leak e gráficos.

Próximo grande passo: **reorganizar o frontend em múltiplas páginas**, separando Home, Summary, Details, Charts, Upload e KPI Management.
