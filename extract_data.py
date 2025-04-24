import os
import json
import datetime
from openpyxl import load_workbook

MODELS = [
    {"name": "Growth", "prefix": "growth"},
    {"name": "Core", "prefix": "core"},
    {"name": "SmallMid", "prefix": "smid"},
    {"name": "Alternatives", "prefix": "alternatives"},
    {"name": "StructuredNotes", "prefix": "structured_notes"},
]

MODEL_METRICS_CONFIG = {
    "growth": {
        "start_row": 29,  # First data row after header
        "end_row": 36     # Last data row
    },
    "core": {
        "start_row": 29,  # First data row after header
        "end_row": 34     # Last data row
    },
    "smid": {
        "start_row": 29,  # First data row after header
        "end_row": 34     # Last data row
    }
}

# Header definitions for structured notes table to ensure consistency
STRUCTURED_NOTES_HEADERS = ["Pricing Date", "Bank", "Ticker", "Short Name", "GICS Sector", "Coupon"]

# Regional allocation column headers
REGIONAL_HEADERS = ["Region", "Holdings", "Weight (%)"]

# Top ten holdings column headers
HOLDINGS_HEADERS = ["Rank", "Name", "Weight (%)"]

# Sector data column headers
SECTOR_HEADERS = ["Sector Name", "New Total (%)", "Diff (%)"]

# Securities cells
SECURITIES_CELLS = {
    "added": "C18",     # Securities Added cell
    "removed": "C20"    # Securities Removed cell
}

# Total recap cells
TOTAL_RECAP = {
    "worksheet": "total_recap",  # Worksheet name
    "recap": "E5",               # Capital Markets Recap cell
    "disclaimer": "E6"           # Disclaimer cell
}

class CleanJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime.datetime, datetime.date)):
            return o.isoformat()
        return super().default(o)

def parse_financial_models(file_path):
    wb = load_workbook(file_path, data_only=True)
    result = {}

    # Extract general information (recap and disclaimer)
    recap_sheet_name = TOTAL_RECAP["worksheet"]
    if recap_sheet_name in wb:
        result["general"] = extract_general_info(wb[recap_sheet_name])

    # Process each investment model
    for model in MODELS:
        name, prefix = model["name"], model["prefix"]

        sheet_name = f"{prefix}_overview"
        if sheet_name not in wb:
            continue
        overview = wb[sheet_name]

        model_data = {}
        model_data["metadata"] = extract_metadata(overview)

        if prefix == "alternatives":
            model_data["commentarySections"] = extract_alternative_commentary(overview)
        elif prefix == "structured_notes":
            model_data["commentary"] = get_cell_value(overview, "D15")
            model_data["notes"] = extract_structured_notes_table(overview)
        else:
            model_data["commentary"] = get_cell_value(overview, "D15")

        stats_name = f"{prefix}_stats"
        if stats_name in wb:
            stats = wb[stats_name]
            model_data["topTenHoldings"] = extract_top_ten_holdings(stats)
            
            # All models get regional allocation except SMID, Alternatives, and StructuredNotes
            if prefix == "growth" or prefix == "core":
                model_data["regionalAllocation"] = extract_regional_allocation(stats)
            
            # Extract metrics for Growth, Core, and SMID models
            if prefix in MODEL_METRICS_CONFIG or prefix == "smid":
                model_data["metrics"] = extract_model_metrics(stats, prefix)

        positions_name = f"{prefix}_positions"
        if positions_name in wb:
            positions = wb[positions_name]
            
            # Extract sectors for Growth, Core, and SmallMid models
            if prefix == "growth" or prefix == "core" or prefix == "smid":
                model_data["sectors"] = extract_sectors(positions)
            
            # Add securities for Core and Growth models only
            if prefix == "growth" or prefix == "core":
                model_data["securitiesAdded"] = extract_comma_list(positions, SECURITIES_CELLS["added"])
                model_data["securitiesRemoved"] = extract_comma_list(positions, SECURITIES_CELLS["removed"])

        result[name] = model_data

    return result

def extract_general_info(sheet):
    """Extract general information like Capital Markets Recap and disclaimer"""
    return {
        "capitalMarketsRecap": get_cell_value(sheet, TOTAL_RECAP["recap"]),
        "disclaimer": get_cell_value(sheet, TOTAL_RECAP["disclaimer"])
    }

def extract_alternative_commentary(sheet):
    out = []
    # Start at row 16 to skip the headers at row 15
    row = 16
    while True:
        label = get_cell_value(sheet, f"C{row}")
        commentary = get_cell_value(sheet, f"D{row}")
        
        # If we have both a label and commentary, add them
        if label and commentary:
            out.append({"label": label, "commentary": commentary})
            row += 1
        else:
            # Stop when we find an empty row or missing either label or commentary
            break
    
    return out

def extract_model_metrics(sheet, model_prefix):
    # Simple extraction based on predefined ranges only
    config = MODEL_METRICS_CONFIG.get(model_prefix, {
        "start_row": 29,  # Default first data row
        "end_row": 34     # Default last data row
    })
    
    start_row = config["start_row"]
    end_row = config["end_row"]
    
    p, b, d = {}, {}, {}
    for row in range(start_row, end_row + 1):
        metric = get_cell_value(sheet, f"B{row}")
        p_val = get_cell_value(sheet, f"C{row}", "number")
        b_val = get_cell_value(sheet, f"D{row}", "number")
        d_val = get_cell_value(sheet, f"E{row}", "number")
        
        if metric:
            p[metric] = p_val
            b[metric] = b_val
            d[metric] = d_val
    
    return {"portfolio": p, "benchmark": b, "difference": d}

def extract_metadata(sheet):
    out = {}
    for row in range(6, 12):
        key = get_cell_value(sheet, f"B{row}")
        val = get_cell_value(sheet, f"C{row}")
        if key:
            out[key] = val
    return out

def extract_top_ten_holdings(sheet):
    out = []
    # Range is B6:D16 according to documentation
    for row in range(7, 17):
        rank = get_cell_value(sheet, f"B{row}", "number")
        name = get_cell_value(sheet, f"C{row}")
        weight = get_cell_value(sheet, f"D{row}", "percentage")
        if name:
            out.append({
                HOLDINGS_HEADERS[0].lower(): rank,  # "Rank"
                HOLDINGS_HEADERS[1].lower(): name,  # "Name"
                HOLDINGS_HEADERS[2].lower().replace(' (%)', ''): weight  # "Weight"
            })
    return out

def extract_regional_allocation(sheet):
    out = []
    # Range is B19:D24 according to documentation
    for row in range(20, 25):
        region = get_cell_value(sheet, f"B{row}")
        count = get_cell_value(sheet, f"C{row}", "number")
        weight = get_cell_value(sheet, f"D{row}", "percentage")
        if region:
            out.append({
                REGIONAL_HEADERS[0].lower(): region,  # "Region"
                REGIONAL_HEADERS[1].lower(): count,   # "Holdings"
                REGIONAL_HEADERS[2].lower().replace(' (%)', ''): weight  # "Weight"
            })
    return out

# Using the model-specific extract_metrics function
def extract_metrics(sheet):
    # This is maintained for backward compatibility
    p, b, d = {}, {}, {}
    for row in range(29, 38):
        metric = get_cell_value(sheet, f"B{row}")
        p_val = get_cell_value(sheet, f"C{row}", "number")
        b_val = get_cell_value(sheet, f"D{row}", "number")
        d_val = get_cell_value(sheet, f"E{row}", "number")
        if metric:
            p[metric] = p_val
            b[metric] = b_val
            d[metric] = d_val
    return {"portfolio": p, "benchmark": b, "difference": d}

def extract_sectors(sheet):
    out = []
    # Range is B4:B15, F4:F15, G4:G15 according to documentation
    for row in range(4, 16):
        name = get_cell_value(sheet, f"B{row}")
        total = get_cell_value(sheet, f"F{row}", "percentage")
        diff = get_cell_value(sheet, f"G{row}", "percentage")
        if name:
            out.append({
                SECTOR_HEADERS[0].lower().replace(' name', ''): name,  # "Sector"
                "total": total,
                "diff": diff
            })
    return out

def extract_comma_list(sheet, cell):
    val = get_cell_value(sheet, cell)
    if not isinstance(val, str):
        return []
    return [s.strip() for s in val.split(",") if s.strip()]

def get_cell_value(sheet, addr, val_type="text"):
    val = sheet[addr].value
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return format_value(val, val_type)
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val
    return val

def format_value(v, t="number"):
    if t in ("percentage", "number"):
        return int(v) if int(v) == v else round(v, 1 if abs(v) > 1 else 2)
    if t == "currency":
        return round(v)
    return v

def extract_structured_notes_table(sheet):
    out, cols = [], ["B", "C", "D", "E", "F", "G"]
    # Get headers from row 18 or use the predefined headers if not found
    headers = [get_cell_value(sheet, f"{c}18") for c in cols]
    
    # Validate headers against expected ones or use default ones
    if not all(headers[:len(STRUCTURED_NOTES_HEADERS)]):
        headers = STRUCTURED_NOTES_HEADERS
        
    row = 19
    # Continue reading rows until we hit an empty value in column D
    while True:
        if not get_cell_value(sheet, f"D{row}"):
            break
        note = {}
        for col, head in zip(cols, headers):
            if head:
                # Only use percentage formatting for Coupon column
                vtype = "percentage" if head == "Coupon" else "text"
                note[head] = get_cell_value(sheet, f"{col}{row}", vtype)
        out.append(note)
        row += 1
    return out

def generate_all_models_json(models_data, output_dir):
    """
    Combines all individual model JSONs into a single all_models.json file
    """
    all_models_path = os.path.join(output_dir, "all_models.json")
    with open(all_models_path, "w", encoding="utf-8") as f:
        json.dump(models_data, f, indent=2, ensure_ascii=False, cls=CleanJSONEncoder)

if __name__ == "__main__":
    input_path = os.path.join("data", "Q1_Report_Input.xlsx")
    output_dir = "data_json"
    os.makedirs(output_dir, exist_ok=True)

    parsed = parse_financial_models(input_path)
    
    # Save individual model files
    for model, data in parsed.items():
        if model == "general":
            # Save general information to a separate file
            with open(os.path.join(output_dir, "general.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False, cls=CleanJSONEncoder)
        else:
            model_filename = model.lower().replace('/', '')  # Handle SmallMid properly
            with open(os.path.join(output_dir, f"{model_filename}.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False, cls=CleanJSONEncoder)
    
    # Generate the combined all_models.json file
    generate_all_models_json(parsed, output_dir)
    
    print(f"Data extraction complete. Generated {len(parsed)} model files and all_models.json in {output_dir}/")
