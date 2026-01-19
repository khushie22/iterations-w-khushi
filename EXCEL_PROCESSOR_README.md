# Excel File Processor

A Python script that processes Excel files in a folder by filtering rows based on column values. Run it manually whenever you download new files - it automatically skips already processed files.

## Features

- **One-time Processing**: Run the script manually to process all new Excel files
- **Smart Filtering**: 
  - Finds the lowest value in a specified column
  - Keeps rows where the value is ≤ 2x the lowest value
  - Removes rows where the value is > 2x the lowest value
- **Process Tracking**: Maintains a list of processed files to avoid reprocessing
- **Efficient**: Only processes new files, skips already processed ones

## Installation

1. **Install Python dependencies** using your Python interpreter:
```bash
C:\Users\kkhus\AppData\Local\Programs\Python\Python314\python.exe -m pip install -r requirements.txt
```

Or if you have the interpreter in your PATH:
```bash
pip install -r requirements.txt
```

Required packages:
- `pandas` - For reading/writing Excel files
- `openpyxl` - Excel file support

## Usage

### Basic Usage

1. **Edit the configuration** in `excel_processor.py`:
   - `FOLDER_PATH`: Path to the folder you want to monitor
   - `COLUMN_NAME`: Name of the column to process
   - `PROCESSED_FILE`: JSON file to track processed files (default: `processed_files.json`)

2. **Run the script**:

**Option 1: Using the batch file (Windows - easiest)**:
```bash
run_excel_processor.bat
```

**Option 2: Using the PowerShell script**:
```powershell
.\run_excel_processor.ps1
```

**Option 3: Direct Python command**:
```bash
C:\Users\kkhus\AppData\Local\Programs\Python\Python314\python.exe excel_processor.py
```

**Option 4: If Python is in your PATH**:
```bash
python excel_processor.py
```

### Command Line Arguments

You can also specify parameters via command line:
```bash
python excel_processor.py "path/to/folder" "ColumnName" "processed_files.json"
```

Arguments:
1. Folder path (required)
2. Column name (required)
3. Processed files tracker (optional, defaults to `processed_files.json`)

### Example

```bash
# Monitor the "excel_files" folder, process the "Price" column
python excel_processor.py "excel_files" "Price"
```

## How It Works

1. **Run the Script**: 
   - Execute the script whenever you download new Excel files
   - The script scans the folder for Excel files

2. **Processing**:
   - Loads the list of previously processed files
   - For each Excel file:
     - Skips if already processed
     - Reads the Excel file
     - Finds the minimum value in the specified column
     - Calculates threshold = 2 × minimum value
     - Filters rows: keeps only rows where column value ≤ threshold
     - Saves the filtered data back to the Excel file
     - Adds filename to processed list

3. **Tracking**:
   - Maintains a JSON file with list of processed filenames
   - Files are only processed once, even if you run the script multiple times

## Example Processing

If your Excel file has a "Price" column with values: `[10, 15, 25, 30, 50, 100]`

- Lowest value: `10`
- Threshold: `2 × 10 = 20`
- Values kept (≤ 20): `10, 15`
- Values removed (> 20): `25, 30, 50, 100`

## Notes

- The script modifies Excel files in place (overwrites the original file)
- Files are processed only once (tracked in the JSON file)
- Run the script manually each time you download new files
- If a column doesn't exist or is empty, the script will log a warning and skip the file
- The script shows a summary at the end with counts of files found, processed, and skipped
