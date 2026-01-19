import json
from pathlib import Path
import pandas as pd


class ExcelProcessor:
    def __init__(self, folder_path, column_name, processed_file="processed_files.json"):
        """
        Initialize the Excel processor.
        
        Args:
            folder_path: Path to the folder to monitor
            column_name: Name of the column to process
            processed_file: JSON file to store list of processed files
        """
        self.folder_path = Path(folder_path)
        self.column_name = column_name
        self.processed_file = Path(processed_file)
        self.processed_files = self.load_processed_files()
        
        # Ensure the folder exists
        self.folder_path.mkdir(parents=True, exist_ok=True)
        
    def load_processed_files(self):
        """Load the list of processed files from JSON."""
        if self.processed_file.exists():
            try:
                with open(self.processed_file, 'r') as f:
                    return set(json.load(f))
            except (json.JSONDecodeError, IOError):
                return set()
        return set()
    
    def save_processed_files(self):
        """Save the list of processed files to JSON."""
        with open(self.processed_file, 'w') as f:
            json.dump(list(self.processed_files), f, indent=2)
    
    def process_excel(self, file_path):
        """
        Process an Excel file:
        1. Find the lowest value in the specified column
        2. Keep values <= 2x the lowest value
        3. Remove rows with values > 2x the lowest value
        """
        try:
            # Read the Excel file
            df = pd.read_excel(file_path)
            
            # Check if column exists
            if self.column_name not in df.columns:
                print(f"Warning: Column '{self.column_name}' not found in {file_path.name}")
                print(f"Available columns: {list(df.columns)}")
                return False
            
            # Get the column values (remove NaN values)
            column_values = df[self.column_name].dropna()
            
            if len(column_values) == 0:
                print(f"Warning: Column '{self.column_name}' is empty in {file_path.name}")
                return False
            
            # Find the lowest value
            lowest_value = column_values.min()
            threshold = 2 * lowest_value
            
            print(f"Processing {file_path.name}:")
            print(f"  Lowest value: {lowest_value}")
            print(f"  Threshold (2x lowest): {threshold}")
            
            # Filter rows: keep values <= 2x the lowest value
            mask = df[self.column_name] <= threshold
            rows_before = len(df)
            df_filtered = df[mask].copy()
            rows_after = len(df_filtered)
            rows_removed = rows_before - rows_after
            
            print(f"  Rows before: {rows_before}")
            print(f"  Rows after: {rows_after}")
            print(f"  Rows removed: {rows_removed}")
            
            # Save the filtered data back to the Excel file
            df_filtered.to_excel(file_path, index=False)
            print(f"  ✓ Successfully processed and saved {file_path.name}\n")
            
            return True
            
        except Exception as e:
            print(f"Error processing {file_path.name}: {str(e)}\n")
            return False
    
    def process_all_new_files(self):
        """Check for new Excel files and process them. Skips already processed files."""
        excel_extensions = ['.xlsx', '.xls']
        files_found = []
        files_processed = 0
        files_skipped = 0
        
        if not self.folder_path.exists():
            print(f"Error: Folder '{self.folder_path}' does not exist.")
            return
        
        print(f"Scanning folder: {self.folder_path}")
        print(f"Column to process: {self.column_name}")
        print(f"Processed files tracker: {self.processed_file}\n")
        
        for file_path in self.folder_path.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in excel_extensions:
                file_name = file_path.name
                files_found.append(file_path)
                
                # Skip if already processed
                if file_name in self.processed_files:
                    print(f"⏭ Skipping {file_name} (already processed)")
                    files_skipped += 1
                    continue
                
                # Process the file
                if self.process_excel(file_path):
                    # Mark as processed
                    self.processed_files.add(file_name)
                    self.save_processed_files()
                    files_processed += 1
        
        print(f"\n{'='*50}")
        print(f"Summary:")
        print(f"  Files found: {len(files_found)}")
        print(f"  Files processed: {files_processed}")
        print(f"  Files skipped (already processed): {files_skipped}")
        print(f"{'='*50}")


def process_folder(folder_path, column_name, processed_file="processed_files.json"):
    """
    Process all new Excel files in a folder.
    
    Args:
        folder_path: Path to the folder to process
        column_name: Name of the column to process
        processed_file: JSON file to store list of processed files
    """
    processor = ExcelProcessor(folder_path, column_name, processed_file)
    processor.process_all_new_files()


if __name__ == "__main__":
    import sys

    # Configuration - updated as per instructions
    FOLDER_PATH = r"C:\Users\kkhus\Downloads\excels"  # Updated folder path
    COLUMN_NAME = "Total Cost (INR)"  # Updated column name
    PROCESSED_FILE = "processed_files.json"  # File to track processed files
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        FOLDER_PATH = sys.argv[1]
    if len(sys.argv) > 2:
        COLUMN_NAME = sys.argv[2]
    if len(sys.argv) > 3:
        PROCESSED_FILE = sys.argv[3]
    
    # Process files in folder
    process_folder(FOLDER_PATH, COLUMN_NAME, PROCESSED_FILE)
