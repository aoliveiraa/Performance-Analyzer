# 🚀 Performance Analyzer

Performance Analyzer is a web-based application designed to automate the analysis of performance test results from NP6 environments.

The solution consolidates Load Reports, Performance Counters, Processes data, KPI Management, Charts, Comparisons, and Summary Reports into a single platform, reducing manual analysis effort and standardizing performance reporting across teams.

---

# 📌 Current Architecture

## Backend

- FastAPI
- SQLite
- Pandas
- Python

## Frontend

- React
- Vite
- Material UI
- Apache ECharts

---

# 📂 Report Structure

Each uploaded report is stored using the following structure:

```text
uploads/
└── run_xxx/
    ├── metadata.json
    ├── load/
    │    ├── *.csv
    ├── counters/
    │    ├── *.csv
    └── processes/
         └── processes.json
```

---

# ✅ Implemented Features

## Report Management

### Create Report

Creates a new report folder:

```text
run_001
run_002
run_003
...
```

### Upload Load Files

Supports multiple Load CSV uploads.

Files are automatically stored under:

```text
uploads/run_xxx/load
```

### Upload Counters Files

Supports multiple Counters CSV uploads.

Files are automatically stored under:

```text
uploads/run_xxx/counters
```

### Upload Processes Files

Supports Processes JSON uploads.

Files are automatically stored under:

```text
uploads/run_xxx/processes
```

### Automatic Metadata Extraction

Metadata is automatically extracted from uploaded file names.

Extracted fields:

```text
Version
Build
Suite
Environment
Date
```

Example:

```text
vNP6.1.36_Bundle36.CA.B12345_SESRM3506_Lab-RDI-Brazil_20260713.csv
```

Produces:

```text
Version: vNP6.1.36
Build: Bundle36.CA.B12345
Suite: SESRM3506
Environment: Lab-RDI-Brazil
Date: 07/13/2026
```

Stored in:

```text
metadata.json
```

---

# 📊 KPI Management

## KPI Database

SQLite database:

```text
performance_analyzer.db
```

Table:

```sql
kpis
```

Fields:

```text
Action Name
KPI (ms)
Category
Enabled
```

---

## KPI Categories

Supported categories:

### Market 0 KPIs

Critical KPIs used by Performance Team.

Examples:

```text
Fries
Medium Coke
Serve Order
Recall
Take Out Total
Store
```

### Other KPIs

Non-priority actions and supporting metrics.

---

## KPI Features

### Create KPI

Allows KPI registration by Action.

Example:

```text
Action: Fries
KPI: 400
Category: Market 0 KPIs
```

### Edit KPI

Allows updating:

```text
KPI Value
Category
```

### Categories

Selectable values:

```text
Market 0 KPIs
Other KPIs
```

### Enabled Flag

Database support already implemented.

Reserved for future use.

---

# 📈 Report Summary

## Summary View

Displays consolidated KPI results grouped by Action.

Includes:

```text
Total Quantity
Min
Max
Average
90th Percentile
PASS / FAIL
```

---

## Market 0 Filtering

Summary is filtered by KPI Category.

Default behavior:

```text
Show Market 0 KPIs Only
```

Only Actions categorized as:

```text
Market 0 KPIs
```

are displayed.

---

# 📋 Expanded Report

Expanded Report displays detailed KPI results.

Grouped by:

```text
Action
Hardware
```

Includes:

```text
PASS
FAIL
NO KPI
```

---

## Market 0 Actions Mode

Expanded Report now supports KPI Category filtering.

### Default

```text
Market 0 Actions
```

### Optional

```text
All Actions
```

---

## UI Toggle

Implemented visual toggle:

```text
[ Market 0 Actions ]
[ All Actions ]
```

Behavior:

- Active button highlighted in green
- Market 0 enabled by default
- Users may switch to All Actions when required

---

# 📊 Charts

Available charts:

## Status Distribution

Displays:

```text
PASS
FAIL
NO KPI
```

---

## Action Charts

Displays:

```text
Action Performance Distribution
```

Endpoint:

```http
GET /charts/actions/{run_id}
```

---

## Memory Trend

Displays memory growth over time.

Endpoint:

```http
GET /charts/memory/{run_id}
```

---

## CPU Trend

Displays CPU utilization.

Endpoint:

```http
GET /charts/cpu/{run_id}
```

---

## Top Memory Consumers

Displays:

```text
Top Memory Processes
```

Endpoint:

```http
GET /charts/top-memory/{run_id}
```

---

## Performance Counters

Tracks:

```text
Private Bytes
Working Set
Handle Count
Thread Count
IO Read Bytes/sec
IO Write Bytes/sec
Processor Time
```

Endpoint:

```http
GET /charts/performance-counters/{run_id}
```

---

# ⚙️ Processes

Processes module supports:

### Upload Processes JSON

Extracts:

```text
Process Name
PID
Instance
Running Status
```

### Filtering

Supports filtering by:

```text
Process Name
Process ID
Instance
Running Status
```

---

# 🔄 Compare Reports

Allows side-by-side comparison between reports.

Compares:

```text
KPI
Average
90th Percentile
Status
```

Supports export functionality.

---

# 🔌 Main Endpoints

## Reports

```http
GET /reports
GET /runs
GET /runs/create
GET /runs/{run_id}/files
DELETE /runs/{run_id}
```

---

## Uploads

```http
POST /runs/{run_id}/upload/load-file
POST /runs/{run_id}/upload/counters-file
POST /runs/{run_id}/upload/processes-file
```

---

## Summary

```http
GET /reports/actions/{run_id}/summary
```

---

## Expanded Report

```http
GET /reports/actions/{run_id}
```

Supports:

```http
?market0_only=true
?market0_only=false
```

---

## Charts

```http
GET /charts/status/{run_id}
GET /charts/actions/{run_id}
GET /charts/memory/{run_id}
GET /charts/cpu/{run_id}
GET /charts/top-memory/{run_id}
GET /charts/performance-counters/{run_id}
```

---

## KPI Management

```http
GET /kpis
POST /kpis
```

---

# ✅ Recent Fixes (July 2026)

### KPI Improvements

- Added KPI Categories
- Added Market 0 KPI classification
- Added category editing
- Fixed KPI persistence bug
- Fixed category update logic

### Reports

- Restored metadata loading
- Restored Load/Counters counts
- Restored report status calculation
- Fixed report details loading

### Expanded Report

- Restored missing endpoint
- Added Market 0 filtering
- Added All Actions mode

### Charts

- Restored charts endpoints
- Fixed multiple 404 errors
- Restored Actions Chart
- Restored Top Memory Chart
- Restored Performance Counters Chart

### Backend Stabilization

Restored endpoints:

```http
GET /runs/{run_id}/files
GET /reports/actions/{run_id}
GET /charts/actions/{run_id}
GET /charts/top-memory/{run_id}
GET /charts/performance-counters/{run_id}
```

---

# 🎯 Next Steps

## UI / UX

- Standardize Report Summary Header
- Align Summary visual style with Expanded Report
- Create reusable Header component
- Improve Charts page responsiveness

---

## KPI Improvements

- Enable/Disable KPI support in UI
- Apply Enabled flag during PASS/FAIL calculation
- KPI bulk import

---

## Reporting

- Market 0 filter support in Charts
- Market 0 filter support in Compare
- KPI Category metrics dashboard

---

## Technical Improvements

- Refactor duplicated filtering logic
- Centralize KPI Category service
- Improve API caching strategy
- Add automated validation tests

---

# ✅ Current Status

```text
Reports....................... Working
Load Upload................... Working
Counters Upload............... Working
Processes..................... Working
Metadata Extraction........... Working
Summary....................... Working
Expanded Report............... Working
Charts........................ Working
Compare....................... Working
KPI Management................ Working
Market 0 KPIs................ Working
SQLite Persistence............ Working
```

---

**Version:** 1.1.0  
**Last Updated:** 17-Jul-2026  
**Status:** Stable