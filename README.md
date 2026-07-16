# 🚀 Performance Analyzer

Web application designed to automate the analysis of performance test reports, consolidating execution results into a centralized, user-friendly dashboard for QA and Performance teams.

---

# 📋 Overview

Performance Analyzer allows users to:

- Upload performance reports
- Store multiple reports
- Analyze KPIs automatically
- Compare executions
- Generate executive summaries
- Analyze detailed metrics
- Visualize trends through charts
- Monitor infrastructure resource utilization
- Review process execution data

---

# ✨ Main Features

## 📁 Report Management

- Automatic report creation on first upload
- Multi-report support
- Persistent report storage
- Automatic report selection
- Report deletion
- Refresh reports list

---

## 🏷️ Automatic Metadata Extraction

The application automatically extracts metadata from uploaded file names.

### Extracted Information

- Version
- Build
- Environment
- Test Suite
- Execution Date

### Example

Filename:

```text
V1.2_B100_Regression_QA_2026-07-15.csv
```

Generated Metadata:

```text
Version: V1.2
Build: B100
Suite: Regression
Environment: QA
Date: 2026-07-15
```

---

# 📊 KPI Analysis

The system automatically calculates important performance metrics.

## Available KPIs

### Transaction Metrics

- Average Response Time
- Minimum Response Time
- Maximum Response Time
- 90th Percentile (P90)
- Error Rate
- Throughput

### Status Evaluation

Transactions are automatically classified as:

✅ PASS

❌ FAIL

Based on configured performance thresholds.

---

# 📈 Report Summary

Each report contains a consolidated summary including:

- Total Transactions
- Passed Transactions
- Failed Transactions
- Average Performance Metrics
- Error Analysis
- Execution Metadata

The Summary page acts as the primary entry point for report analysis.

---

# 🔍 Detailed Analysis

The Details page provides transaction-level data.

## Information Displayed

- Transaction Name
- Average Response Time
- P90 Response Time
- Error Count
- Pass/Fail Status

## Filters

- Transaction Search
- Status Filter
- Dynamic Table Filtering

---

# 📉 Interactive Charts

Charts are built using:

- Apache ECharts
- Material UI

## Available Charts

### Response Time Metrics

- Average Time
- P90
- Maximum Time

### Resource Utilization

- CPU Usage
- Memory Usage
- I/O Statistics
- Process Activity

### Comparison Charts

- Multi-report comparison
- Side-by-side KPI analysis
- Trend visualization

---

# ⚙️ Processes Analysis

Dedicated module for analyzing process execution data from JSON files.

## Features

- JSON Upload
- Persistent Storage
- Automatic Processing
- Process Aggregation

## Available Filters

- Instance
- Process ID
- Process Name
- Running Status

## Displayed Data

- Instance
- Process Name
- PID
- Running State
- Consolidated Runtime Information

The system automatically groups process execution records into a unified view.

---

# 🔄 Report Comparison

Compare multiple reports simultaneously.

## Metrics Compared

- Average Response Time
- P90
- Error Rate
- Throughput
- Pass/Fail Status

## Benefits

- Detect regressions
- Validate releases
- Compare environments
- Track performance evolution

---

# 🎨 User Experience Improvements

## Responsive Design

- Mobile-friendly layout
- CSS Grid responsiveness
- Responsive cards

## Modern Navigation

- Sidebar navigation
- Active menu highlighting
- Improved routing
- Quick access actions

## Visual Identity

- Green-based theme
- Enhanced buttons and cards
- Improved readability
- Cleaner overall user experience

---

# 🛠️ Technology Stack

## Backend

```text
FastAPI
Python
SQLite
Pandas
NumPy
```

## Frontend

```text
React
Vite
Material UI
Apache ECharts
Axios
React Router
```

---

# 📂 Project Structure

```text
backend/
│
├── services/
│   ├── reports_service.py
│   ├── processes_service.py
│   ├── run_files_service.py
│   └── metrics_service.py
│
├── uploads/
│   └── run_xxx/
│       ├── metadata.json
│       ├── processes.json
│       └── csv files
│
└── main.py

frontend/
│
├── pages/
│   ├── ReportsHome.jsx
│   ├── ReportDetails.jsx
│   ├── ChartsPage.jsx
│   ├── ProcessesPage.jsx
│   └── CompareReportsPage.jsx
│
├── components/
│
└── App.jsx
```

---

# 🔄 Application Workflow

## 1. Upload Report

Upload one or more CSV files.

## 2. Automatic Report Creation

The application automatically creates a report when needed.

## 3. KPI Processing

Metrics are calculated and stored.

## 4. Summary Review

Review the execution overview.

## 5. Detailed Investigation

Analyze transaction-level metrics.

## 6. Resource Analysis

Inspect CPU, Memory, Process and I/O information.

## 7. Report Comparison

Compare executions and identify regressions.

---

# 🗺️ Roadmap

## Short-Term Improvements

- PDF Export
- Excel Export
- Advanced Filters
- Dark Mode
- Custom KPI Thresholds

## Mid-Term Improvements

- Historical Trend Analysis
- Scheduled Reports
- Authentication
- Report Sharing

## Long-Term Improvements

- AI-Powered Insights
- Root Cause Suggestions
- Predictive Analysis
- Executive Dashboard

---

# ✅ Current Status

| Feature | Status |
|----------|----------|
| Multi Report Support | ✅ Complete |
| KPI Calculation Engine | ✅ Complete |
| Automatic Metadata Extraction | ✅ Complete |
| Report Summary | ✅ Complete |
| Detailed Analysis | ✅ Complete |
| Interactive Charts | ✅ Complete |
| Process Analysis Module | ✅ Complete |
| Report Comparison | ✅ Complete |
| Responsive UI | ✅ Complete |
| Sidebar Navigation | ✅ Complete |
| PDF Export | 🚧 Planned |
| Excel Export | 🚧 Planned |
| AI Insights | 🚧 Planned |

---

# 👩‍💻 Author

**Adrianne de Oliveira Matos**  
Senior QA / Performance Engineer  
Performance Team

---

# 📌 Project Status

✅ Active Development

✅ Production-Ready Core Features

✅ Dashboard Modernization Completed

✅ Process Analysis Implemented

✅ Report Comparison Implemented

🚧 Continuous Improvements In Progress