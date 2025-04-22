@echo off
echo ===== Hohimer Wealth Management Quarterly Report Generator =====
echo.
echo [1/2] Extracting data from Excel to JSON...
python extract_data.py
if %ERRORLEVEL% neq 0 (
    echo ERROR: Data extraction failed! Check the error messages above.
    pause
    exit /b 1
)
echo Data extraction completed successfully.
echo.

echo [2/2] Generating PDF report...
python generate_pdf.py
if %ERRORLEVEL% neq 0 (
    echo ERROR: PDF generation failed! Check the error messages above.
    pause
    exit /b 1
)
echo PDF generation completed successfully.
echo.

echo ===== Report generation complete! =====
echo Output PDF is ready for review.
echo.

pause 