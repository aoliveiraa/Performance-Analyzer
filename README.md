# 🚀 Performance Analyzer

Performance Analyzer is a web application designed to automate the analysis of performance test executions.

The system consolidates Load CSVs, Counters CSVs, and Processes JSON files into a single report, generating:

- Executive summaries
- Detailed Action reports
- KPI evaluation
- PASS / FAIL analysis
- Performance charts
- Report comparison
- Process analysis

The application was created to support Performance Testing activities and reduce manual effort during report generation.

---

# 📐 Architecture

## Backend

### Technology

```text
FastAPI
Python
Pandas
SQLite
```

### Responsibilities

```text
- Report management
- File upload
- KPI management
- Metrics calculations
- Chart data generation
- Report comparison
```

### Structure

```text
backend/

app/
├── chart_service.py
├── counters_parser.py
├── kpi_service.py
├── load_parser.py
├── processes_service.py
├── report_generator.py
├── reports_service.py
├── run_files_service.py
├── run_service.py

main.py
```

---

## Frontend

### Technology

```text
React
Vite
Material UI
Apache ECharts
```

### Responsibilities

```text
- Report management
- Visual dashboards
- Upload workflows
- Report comparison
- Process visualization
- Charts visualization
```

---

# 🔄 Current Workflow

## Reports

The application is report-based.

A report represents a complete performance execution.

Example:

```text
run_012
```

The user never works directly with technical IDs.

The Reports page displays:

```text
Version
Build
Suite
Environment
Date
```

extracted automatically from uploaded filenames.

---

# 📤 Upload Flow

## Create Report

Endpoint:

```http
POST /runs/create
```

Creates:

```text
uploads/run_xxx/
```

and automatically selects the newly created report.

---

## Load Files

### IMPORTANT

Use:

```http
POST /runs/{run_id}/upload/load-file
```

DO NOT use:

```http
POST /runs/{run_id}/upload/load
```

The old endpoint caused a historical bug where files were uploaded successfully but did not appear in the report.

Current valid endpoint:

```http
POST /runs/{run_id}/upload/load-file
```

---

## Counters Files

Endpoint:

```http
POST /runs/{run_id}/upload/counters-file
```

Storage:

```text
uploads/run_xxx/counters/
```

---

## Processes JSON

Endpoint:

```http
POST /runs/{run_id}/upload/processes-file
```

Storage:

```text
uploads/run_xxx/processes.json
```

---

# 🏷 Metadata

Metadata is extracted automatically from filenames.

Example:

```text
vNP6.1.36_Bundle36.UK.B32435_SESRM3506_Lab-RDI-Brazil_20260710.csv
```

Generates:

```json
{
  "version": "vNP6.1.36",
  "build": "Bundle36.UK.B32435",
  "suite": "SESRM3506",
  "environment": "Lab-RDI-Brazil",
  "date": "2026-07-10"
}
```

Saved as:

```text
uploads/run_xxx/metadata.json
```

---

# 📄 Application Pages

---

## Reports

Features:

```text
- Report listing
- Filtering
- Delete report
- Open report
```

Displays metadata instead of technical run IDs.

---

## Summary

Route:

```text
/report/{runId}/summary
```

Displays:

```text
One row per Action
```

Consolidated across all hardware.

---

## Expanded Report

Route:

```text
/report/{runId}/details
```

### UX Redesign Completed

Features:

```text
- Modern Header
- Navigation Tabs
- KPI Cards
- Action Grouping
- Hardware Breakdown
```

### Structure

```text
Action
 └── Hardware
      └── Metrics
```

Metrics:

```text
KPI
Average
Min
Max
50th Percentile
90th Percentile
PASS / FAIL
```

---

## Charts

Route:

```text
/report/{runId}/charts
```

Displays:

```text
Action trend
Memory trend
CPU trend
Process timelines
Performance counters
Top resource consumers
```

---

## Processes

Route:

```text
/report/{runId}/processes
```

Displays:

```text
Process Name
Process ID
Instance
Running Processes
```

Includes:

```text
Upload
Persistence
Filters
Counters
```

---

## Compare

Route:

```text
/compare
```

Features:

```text
Select Report A
Select Report B

Compare:
- KPI
- Average
- P90
- PASS / FAIL
```

Export:

```text
Excel Export
```

Status:

```text
Working
Validated
```

---

# 📊 KPI Evaluation

Database:

```text
SQLite
```

Table:

```text
kpis
```

Evaluation Rule:

```text
90th Percentile <= KPI
```

Result:

```text
PASS
```

Otherwise:

```text
FAIL
```

If KPI not found:

```text
NO KPI
```

---

# ✅ Recent Deliveries

## Report Creation Flow

Completed:

```text
- Automatic Report Creation
- Auto-selection of newly created Report
- Report persistence
```

---

## Upload Flow

Completed:

```text
- Load CSV Upload
- Counters CSV Upload
- Processes JSON Upload
- File persistence
- File listing
```

---

## Compare

Completed:

```text
- Report selection
- KPI comparison
- Export to Excel
```

Validated and operational.

---

## Expanded Report UX

Completed:

```text
- New Header Design
- Details Navigation
- Summary Navigation
- Upload Navigation
- Charts Navigation
- Processes Navigation
- Compare Navigation
```

### KPI Cards Added

```text
Actions
Hardware Rows
PASS
FAIL
NO KPI
```

### Preserved

```text
Action
 -> Hardware
     -> Metrics
```

This structure MUST NOT be removed or replaced.

It is the primary view used by the Performance Team.

---

# 🐞 Historical Bugs Fixed

## Upload Bug

Problem:

```text
Files uploaded successfully
but report appeared empty
```

Cause:

```http
/runs/{run_id}/upload/load
```

used instead of:

```http
/runs/{run_id}/upload/load-file
```

Resolution:

```http
/runs/{run_id}/upload/load-file
```

is now mandatory.

---

## Report Selection Bug

Problem:

```text
New report created
Previous report remained selected
```

Resolution:

Selection logic updated after report creation.

---

# ⚠ Current Known Issue

## Expanded Report Metadata

Status:

```text
IN PROGRESS
```

Goal:

Replace:

```text
Run: run_012
```

with:

```text
Version
Build
Suite
Environment
Date
```

Current UI already supports metadata chips.

Missing validation:

```jsx
GET /runs/{runId}/files
```

must populate:

```jsx
metadata.version
metadata.build
metadata.suite
metadata.environment
metadata.date
```

Current screen loads successfully but metadata integration is still being finalized.

---

# 🧠 Development Notes

## DO NOT CHANGE

Core structure:

```text
Action
 └── Hardware
      └── Metrics
```

This is a business requirement and is heavily used during performance analysis.

---

## UI Standard Going Forward

Preferred layout:

```text
Header
Metadata Chips
Navigation Tabs

Summary Cards

Results
```

Pages to align visually:

```text
Summary
Details
Charts
Processes
Compare
```

---

# 📋 Roadmap

## High Priority

```text
Finish metadata integration in Expanded Report
Create reusable Header component
Visual alignment across pages
```

---

## Medium Priority

```text
Executive PDF Export
Comparison Report PDF
Advanced Filters
Dark Theme
```

---

## Long Term

```text
Authentication
Multi-user support
Historical reporting
KPI Analytics
Scheduled report generation
```

---

# 👩‍💻 Project Owner

```text
Adrianne de Oliveira Matos
Performance Team
RDI
```

---

# ⚡ Quick Start

Backend:

```bash
cd backend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Frontend:

```bash
cd frontend

npm install

npm run dev
```

Application:

```text
Backend:
http://localhost:8000

Frontend:
http://localhost:5173
```