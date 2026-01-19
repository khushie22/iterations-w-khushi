# Run Excel processor with specific Python interpreter
$pythonPath = "C:\Users\kkhus\AppData\Local\Programs\Python\Python314\python.exe"

if (Test-Path $pythonPath) {
    & $pythonPath excel_processor.py
} else {
    Write-Host "Error: Python interpreter not found at $pythonPath" -ForegroundColor Red
    Write-Host "Please check the path and update it if needed." -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
