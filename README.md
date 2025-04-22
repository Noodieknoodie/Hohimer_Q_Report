# Quarterly Investment Report Generator

Generate a polished, client‑ready PDF summarizing Hohimer Wealth Management's investment models in **three steps**.

## 1 — Input
• `data/Q1_Report_Input.xlsx` (or any similarly structured workbook) – contains every metric, holding, and commentary point that appears in the report.

## 2 — Transform
• `extract_data.py` reads the workbook and writes clean JSON to `data_json/`:
  ├─ `growth.json`           – Growth model
  ├─ `core.json`             – Core model
  ├─ `smallmid.json`         – Small/Mid Cap model
  ├─ `alternatives.json`     – Alternatives
  ├─ `structurednotes.json`  – Structured Notes
  └─ `all_models.json`       – Aggregate of the above (convenience).

## 3 — Present
• `report.html` + `styles.css` form a standalone, print‑ready document. They load the JSON produced in step 2 via client‑side JS (`report.js`).
• `generate_pdf.py` spins up a tiny local HTTP server, renders `report.html` headlessly with Playwright/Chromium, and saves the final **`report.pdf`** (letter, full‑bleed, with background graphics).

```bash
# install dependencies
pip install openpyxl playwright
playwright install

# 1. parse Excel → JSON
python extract_data.py

# 2. render HTML → PDF
python generate_pdf.py report.html   # outputs report.pdf next to the html
```

That's it—update the Excel file, rerun the two commands, and a fresh quarterly report drops out.

---
### File quick‑reference
| File | Purpose |
| ---- | ------- |
| `extract_data.py` | Parse Excel into structured JSON (uses openpyxl). |
| `report.html` / `styles.css` / `report.js` | Visual template & logic for the report. |
| `generate_pdf.py` | Headless browser → PDF utility (uses Playwright). |
| `Q1_COVER.png` | Cover image shown on page 1 of the PDF. |

### Requirements
Python 3.8+, Playwright ≥1.40, openpyxl.