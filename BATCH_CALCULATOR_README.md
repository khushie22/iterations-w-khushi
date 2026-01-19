# Batch Calculator Script

This script automates the calculation of cost combinations for multiple scenarios from a CSV file.

## Requirements

- Python 3.7+
- Node.js and npm (for running TypeScript calculator)
- Required Python packages: `pandas`, `openpyxl`

Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Prepare your CSV file at: `D:\AI Product\software numbers.csv`
   - Required columns: `users`, `minutes`, `concurrency`
   - Each row represents a different scenario

2. Run the batch calculator:
```bash
python batch_calculator.py
```

## Configuration

Edit the following constants in `batch_calculator.py` if needed:

- `CSV_PATH`: Path to your input CSV file
- `OUTPUT_DIR_INBUILT`: Directory for inbuilt voice Excel files
- `OUTPUT_DIR_VOICE`: Directory for voice agent Excel files
- `MONTHLY_BUDGET_INR`: Monthly budget (default: ₹100,000)
- `API_ALLOCATION_PERCENT`: API allocation percentage (default: 60%)
- `HOSTING_ALLOCATION_PERCENT`: Hosting allocation percentage (default: 40%)

## Output

For each row in the CSV, the script generates:

1. **Inbuilt Voice Excel**: `{MINUTES}_{CONCURRENCY}_INBUILT.xlsx`
   - Saved to: `C:\Users\kkhus\Downloads\excels_inbuilt`

2. **Voice Agent Excel**: `{MINUTES}_{CONCURRENCY}_VOICE.xlsx`
   - Saved to: `C:\Users\kkhus\Downloads\excels_voice`

Each Excel file contains all combinations with the following columns:
- Combination details (ID, avatar plan, voice agent, hosting)
- Cost breakdown (avatar, voice, hosting, total)
- Budget fit status
- Score and warnings

## Example

If your CSV has a row with:
- minutes: 5000
- concurrency: 10
- users: 100

The script will generate:
- `5000_10_INBUILT.xlsx` (inbuilt voice results)
- `5000_10_VOICE.xlsx` (voice agent results)
