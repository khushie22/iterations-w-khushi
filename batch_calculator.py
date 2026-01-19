"""
Batch Calculator Script
Reads CSV with scenarios and generates Excel files with all combinations
for both inbuilt voice and voice agent options.
"""

import json
import subprocess
import pandas as pd
from pathlib import Path
import sys
import os
import shutil
import tempfile

# Configuration
CSV_PATH = r"D:\AI Product\software numbers.csv"
OUTPUT_DIR_INBUILT = r"C:\Users\kkhus\Downloads\excels_inbuilt"
OUTPUT_DIR_VOICE = r"C:\Users\kkhus\Downloads\excels_voice"

# Fixed parameters
MONTHLY_BUDGET_INR = 100000  # 1 lakh
API_ALLOCATION_PERCENT = 60
HOSTING_ALLOCATION_PERCENT = 40

# Get the project root directory (where this script is located)
PROJECT_ROOT = Path(__file__).parent
CALCULATOR_SCRIPT = PROJECT_ROOT / "scripts" / "calculate-batch.ts"

# Find npx command (handle Windows)
def find_npx():
    """Find npx command, trying different variations for Windows."""
    # Try npx first
    npx_path = shutil.which("npx")
    if npx_path:
        return npx_path
    
    # Try npx.cmd on Windows
    npx_cmd = shutil.which("npx.cmd")
    if npx_cmd:
        return npx_cmd
    
    # Try npm.cmd with npx argument
    npm_cmd = shutil.which("npm.cmd")
    if npm_cmd:
        return [npm_cmd, "exec", "tsx"]
    
    # On Windows, try common Node.js installation paths
    if sys.platform == "win32":
        common_paths = [
            os.path.join(os.environ.get("ProgramFiles", ""), "nodejs", "npx.cmd"),
            os.path.join(os.environ.get("ProgramFiles(x86)", ""), "nodejs", "npx.cmd"),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Microsoft VS Code", "bin", "npx.cmd"),
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path
    
    raise FileNotFoundError(
        "npx not found. Please ensure Node.js is installed and in your PATH.\n"
        "You can install Node.js from https://nodejs.org/\n"
        "Or add Node.js to your PATH environment variable."
    )


def flatten_combination(combo, rank):
    """Flatten a combination object for Excel export - matching web app format."""
    avatar_plan = combo.get("avatarPlan", {})
    voice_agent = combo.get("voiceAgent")
    hosting_option = combo.get("hostingOption", {})
    breakdown = combo.get("breakdown", {})
    
    flat = {
        # Summary columns (matching web app)
        "Rank": rank,
        "Fits Budget": "Yes" if combo.get("fitsBudget", False) else "No",
        "Score": round(combo.get("score", 0)),
        "Total Cost (INR)": breakdown.get("totalCostINR", 0),
        "Total Cost (USD)": breakdown.get("totalCostUSD", 0),
        # Main providers/options
        "Avatar Provider": avatar_plan.get("provider", ""),
        "Avatar Plan": avatar_plan.get("name", ""),
        "Avatar Accounts": combo.get("avatarAccounts", 0),
        "Voice Agent": voice_agent.get("name", "Inbuilt (Avatar)") if voice_agent else "Inbuilt (Avatar)",
        "Voice Accounts": combo.get("voiceAccounts", 0),
        "Hosting Option": hosting_option.get("name", ""),
        # Avatar detailed breakdown
        "Avatar Tier": avatar_plan.get("tier", ""),
        "Avatar Minutes Included": avatar_plan.get("minutes", 0),
        "Avatar Additional Minutes": breakdown.get("avatarAdditionalMinutes", 0),
        "Avatar Additional $/min": avatar_plan.get("additionalPerMin", 0),
        "Avatar Base Cost (USD)": breakdown.get("avatarBaseCostUSD", 0),
        "Avatar Additional Cost (USD)": breakdown.get("avatarAdditionalCostUSD", 0),
        "Avatar Total Cost (INR)": breakdown.get("avatarCostINR", 0),
        # Voice detailed breakdown
        "Voice Pricing Model": voice_agent.get("pricingModel", "inbuilt") if voice_agent else "inbuilt",
        "Voice Total Tokens": breakdown.get("voiceTotalTokens", "") if breakdown.get("voiceTotalTokens") else "",
        "Voice Base/Minimum (USD)": breakdown.get("voiceBaseCostUSD", "") if breakdown.get("voiceBaseCostUSD") else "",
        "Voice Per-Minute Cost (USD)": breakdown.get("voicePerMinuteCostUSD", "") if breakdown.get("voicePerMinuteCostUSD") else "",
        "Voice Total Cost (INR)": breakdown.get("voiceCostINR", 0),
        "Voice Total Cost (USD)": breakdown.get("voiceCostUSD", 0),
        # Hosting detailed breakdown
        "Hosting Base (INR)": breakdown.get("hostingBaseCostINR", 0),
        "Hosting Users Cost (INR)": breakdown.get("hostingUsersCostINR", 0),
        "Hosting Calls Cost (INR)": breakdown.get("hostingCallsCostINR", 0),
        "Hosting Total (INR)": breakdown.get("hostingCostINR", 0),
        # Miscellaneous
        "Misc Expenses (INR)": breakdown.get("miscExpensesINR", 0),
        "Warnings": "; ".join(combo.get("warnings", [])),
        # Plan notes (e.g., annual commitment info)
        "Plan Note": avatar_plan.get("note", "") if avatar_plan else "",
    }
    return flat


def calculate_combinations(users, minutes, concurrency, use_voice_agent):
    """Call TypeScript calculator and get results."""
    input_data = {
        "monthlyBudgetINR": MONTHLY_BUDGET_INR,
        "apiAllocationPercent": API_ALLOCATION_PERCENT,
        "hostingAllocationPercent": HOSTING_ALLOCATION_PERCENT,
        "users": int(users),
        "concurrentSessions": int(concurrency),
        "minutesPerMonth": int(minutes),
        "useVoiceAgent": use_voice_agent
    }
    
    input_json = json.dumps(input_data)
    
    # Use a temporary file to pass JSON (avoids escaping issues on Windows)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as tmp_file:
        tmp_file.write(input_json)
        tmp_file_path = tmp_file.name
    
    try:
        # On Windows, use shell=True with string command to handle PATH
        if sys.platform == "win32":
            # Use npx directly as string command (Windows will find it via PATH)
            script_path = str(CALCULATOR_SCRIPT)
            cmd = f'npx tsx "{script_path}" "{tmp_file_path}"'
            use_shell = True
        else:
            # On Unix, use list command
            npx_cmd = find_npx()
            if isinstance(npx_cmd, list):
                cmd = npx_cmd + [str(CALCULATOR_SCRIPT), tmp_file_path]
            else:
                cmd = [npx_cmd, "tsx", str(CALCULATOR_SCRIPT), tmp_file_path]
            use_shell = False
        
        # Run TypeScript calculator via tsx
        result = subprocess.run(
            cmd,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            check=True,
            shell=use_shell
        )
        
        # Parse JSON output
        output = result.stdout.strip()
        if not output:
            raise ValueError("No output from calculator script")
        
        combinations = json.loads(output)
        return combinations
    except FileNotFoundError as e:
        print(f"Error: {e}")
        raise
    except subprocess.CalledProcessError as e:
        print(f"Error running calculator:")
        if isinstance(cmd, str):
            print(f"  Command: {cmd}")
        else:
            print(f"  Command: {' '.join(cmd)}")
        print(f"  Return code: {e.returncode}")
        print(f"  Stdout: {e.stdout}")
        print(f"  Stderr: {e.stderr}")
        raise
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON output: {e}")
        print(f"Output was: {result.stdout}")
        raise
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_file_path)
        except:
            pass


def process_row(row, row_num, total_rows):
    """Process a single CSV row and generate Excel files."""
    users = row['users']
    minutes = row['minutes']
    concurrency = row['concurrency']
    
    print(f"\n[{row_num}/{total_rows}] Processing: {minutes} min, {concurrency} concurrent, {users} users")
    
    # Process inbuilt voice
    print("  → Calculating with inbuilt voice...")
    try:
        inbuilt_combos = calculate_combinations(users, minutes, concurrency, False)
        save_to_excel(inbuilt_combos, minutes, concurrency, "INBUILT", OUTPUT_DIR_INBUILT)
        print(f"  ✓ Saved {len(inbuilt_combos)} combinations to inbuilt voice Excel")
    except Exception as e:
        print(f"  ✗ Error processing inbuilt voice: {e}")
    
    # Process voice agent
    print("  → Calculating with voice agent...")
    try:
        voice_combos = calculate_combinations(users, minutes, concurrency, True)
        save_to_excel(voice_combos, minutes, concurrency, "VOICE", OUTPUT_DIR_VOICE)
        print(f"  ✓ Saved {len(voice_combos)} combinations to voice agent Excel")
    except Exception as e:
        print(f"  ✗ Error processing voice agent: {e}")


def save_to_excel(combinations, minutes, concurrency, voice_type, output_dir):
    """Save combinations to Excel file - matching web app format."""
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Flatten combinations for Excel (with rank matching web app)
    flattened = [flatten_combination(combo, index + 1) for index, combo in enumerate(combinations)]
    
    # Create DataFrame
    df = pd.DataFrame(flattened)
    
    # Generate filename
    filename = f"{int(minutes)}_{int(concurrency)}_{voice_type}.xlsx"
    filepath = Path(output_dir) / filename
    
    # Save to Excel
    df.to_excel(filepath, index=False, engine='openpyxl')
    
    return filepath


def main():
    """Main function to process CSV and generate Excel files."""
    print("=" * 60)
    print("Batch Calculator - Processing CSV Scenarios")
    print("=" * 60)
    print(f"CSV Path: {CSV_PATH}")
    print(f"Inbuilt Voice Output: {OUTPUT_DIR_INBUILT}")
    print(f"Voice Agent Output: {OUTPUT_DIR_VOICE}")
    print(f"Budget: ₹{MONTHLY_BUDGET_INR:,} (API: {API_ALLOCATION_PERCENT}%, Hosting: {HOSTING_ALLOCATION_PERCENT}%)")
    print("=" * 60)
    
    # Check if CSV exists
    csv_path = Path(CSV_PATH)
    if not csv_path.exists():
        print(f"Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)
    
    # Check if calculator script exists
    if not CALCULATOR_SCRIPT.exists():
        print(f"Error: Calculator script not found at {CALCULATOR_SCRIPT}")
        sys.exit(1)
    
    # Check if npx is available
    try:
        find_npx()
        print("✓ npx found")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Read CSV
    try:
        df = pd.read_csv(csv_path)
        print(f"\n✓ Loaded CSV with {len(df)} rows")
        
        # Normalize column names to lowercase for case-insensitive matching
        df.columns = df.columns.str.lower()
        print(f"Original columns normalized to lowercase: {list(df.columns)}")
        
        # Validate columns
        required_columns = ['users', 'minutes', 'concurrency']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"Error: Missing required columns: {missing_columns}")
            print(f"Available columns: {list(df.columns)}")
            sys.exit(1)
        
        print(f"✓ All required columns found")
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)
    
    # Process each row
    total_rows = len(df)
    for idx, row in df.iterrows():
        try:
            process_row(row, idx + 1, total_rows)
        except Exception as e:
            print(f"  ✗ Error processing row {idx + 1}: {e}")
            continue
    
    print("\n" + "=" * 60)
    print("✓ Batch processing completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
