"""
Excel Merger Script
Merges Excel files from excels_inbuilt and excels_voice folders in an alternating pattern.
Headers are included only from the first file.
"""

import pandas as pd
from pathlib import Path
import sys
from datetime import datetime
import re


def natural_sort_key(filename):
    """
    Generate a sort key for natural/numeric sorting.
    Splits filename into text and numeric parts for proper numeric ordering.
    
    Example: "1000_10_INBUILT.xlsx" -> [1000, '_', 10, '_INBUILT.xlsx']
    This ensures 1000 comes before 2000, and 10000 comes after 9000.
    """
    def convert(text):
        return int(text) if text.isdigit() else text.lower()
    
    return [convert(c) for c in re.split(r'(\d+)', str(filename))]


def get_sorted_excel_files(folder_path):
    """
    Get all Excel files from a folder, sorted in natural/numeric ascending order.
    
    Args:
        folder_path: Path to the folder containing Excel files
        
    Returns:
        List of sorted file paths
    """
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Warning: Folder '{folder_path}' does not exist.")
        return []
    
    excel_extensions = ['.xlsx', '.xls']
    files = [
        f for f in folder.iterdir() 
        if f.is_file() and f.suffix.lower() in excel_extensions
    ]
    
    # Sort files in natural/numeric ascending order
    # This ensures numbers are sorted numerically: 1000, 2000, ..., 10000, 11000
    files.sort(key=lambda x: natural_sort_key(x.name))
    
    return files


def read_excel_data(file_path, include_headers=True):
    """
    Read all data from an Excel file.
    
    Args:
        file_path: Path to the Excel file
        include_headers: If True, first row is treated as headers. 
                        If False, first row is skipped (assumed to be headers).
        
    Returns:
        DataFrame with the file's data, or None if error
    """
    try:
        if include_headers:
            df = pd.read_excel(file_path)
        else:
            # Read without headers, then skip first row (which contains headers)
            df = pd.read_excel(file_path, header=None)
            if len(df) > 0:
                df = df.iloc[1:]  # Skip first row
                # Use the first file's column names if available
                # (This will be set by the caller)
        return df
    except Exception as e:
        print(f"Error reading {file_path.name}: {str(e)}")
        return None


def merge_excel_files(folder_inbuilt, folder_voice, output_file):
    """
    Merge Excel files from two folders in an alternating pattern.
    
    Args:
        folder_inbuilt: Path to excels_inbuilt folder
        folder_voice: Path to excels_voice folder
        output_file: Path to the output merged Excel file
    """
    # Get sorted files from both folders
    files_inbuilt = get_sorted_excel_files(folder_inbuilt)
    files_voice = get_sorted_excel_files(folder_voice)
    
    if not files_inbuilt and not files_voice:
        print("Error: No Excel files found in either folder.")
        return False
    
    print(f"Found {len(files_inbuilt)} files in excels_inbuilt folder")
    print(f"Found {len(files_voice)} files in excels_voice folder")
    print(f"\nStarting merge process...\n")
    
    # List to store all dataframes
    merged_dataframes = []
    first_file = True
    header_columns = None  # Store column names from first file
    
    # Determine the maximum number of iterations needed
    max_files = max(len(files_inbuilt), len(files_voice))
    
    for i in range(max_files):
        # Process excels_inbuilt file
        if i < len(files_inbuilt):
            file_path = files_inbuilt[i]
            print(f"Processing: {file_path.name} (from excels_inbuilt)")
            df = read_excel_data(file_path, include_headers=first_file)
            
            if df is not None:
                if first_file:
                    # Include headers from first file
                    header_columns = df.columns.tolist()
                    merged_dataframes.append(df)
                    first_file = False
                else:
                    # Skip headers for subsequent files - use same column structure
                    df.columns = header_columns
                    merged_dataframes.append(df)
                
                # Add blank row after this file's data
                blank_df = pd.DataFrame([[''] * len(df.columns)], columns=df.columns)
                merged_dataframes.append(blank_df)
        
        # Process excels_voice file
        if i < len(files_voice):
            file_path = files_voice[i]
            print(f"Processing: {file_path.name} (from excels_voice)")
            df = read_excel_data(file_path, include_headers=first_file)
            
            if df is not None:
                if first_file:
                    # Include headers from first file
                    header_columns = df.columns.tolist()
                    merged_dataframes.append(df)
                    first_file = False
                else:
                    # Skip headers for subsequent files - use same column structure
                    df.columns = header_columns
                    merged_dataframes.append(df)
                
                # Add blank row after this file's data
                blank_df = pd.DataFrame([[''] * len(df.columns)], columns=df.columns)
                merged_dataframes.append(blank_df)
    
    if not merged_dataframes:
        print("Error: No data to merge.")
        return False
    
    # Combine all dataframes
    print(f"\nCombining all data...")
    final_df = pd.concat(merged_dataframes, ignore_index=True)
    
    # Remove the last blank row if it exists
    if final_df.iloc[-1].isna().all() or (final_df.iloc[-1] == '').all():
        final_df = final_df.iloc[:-1]
    
    # Save to output file
    try:
        output_path = Path(output_file)
        final_df.to_excel(output_path, index=False)
        print(f"\n✓ Successfully merged all files!")
        print(f"✓ Output saved to: {output_path.absolute()}")
        print(f"✓ Total rows in merged file: {len(final_df)}")
        return True
    except Exception as e:
        print(f"\nError saving output file: {str(e)}")
        return False


def main():
    """Main function to run the Excel merger."""
    # Default configuration
    FOLDER_INBUILT = r"C:\Users\kkhus\Downloads\excels_inbuilt"
    FOLDER_VOICE = r"C:\Users\kkhus\Downloads\excels_voice"
    
    # Generate output filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    OUTPUT_DIR = r"C:\Users\kkhus\Downloads"
    OUTPUT_FILE = Path(OUTPUT_DIR) / f"merged_excel_{timestamp}.xlsx"
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        FOLDER_INBUILT = sys.argv[1]
    if len(sys.argv) > 2:
        FOLDER_VOICE = sys.argv[2]
    if len(sys.argv) > 3:
        OUTPUT_FILE = Path(sys.argv[3])
    
    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("Excel Merger Script")
    print("=" * 60)
    print(f"Input folder 1 (excels_inbuilt): {FOLDER_INBUILT}")
    print(f"Input folder 2 (excels_voice): {FOLDER_VOICE}")
    print(f"Output file: {OUTPUT_FILE}")
    print("=" * 60)
    print()
    
    # Run the merge
    success = merge_excel_files(FOLDER_INBUILT, FOLDER_VOICE, OUTPUT_FILE)
    
    if success:
        print("\n" + "=" * 60)
        print("Merge completed successfully!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Merge failed. Please check the errors above.")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
