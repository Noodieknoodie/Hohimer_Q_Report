#!/bin/bash

echo "===== Hohimer Wealth Management Quarterly Report Generator ====="
echo ""
echo "[1/2] Extracting data from Excel to JSON..."
python extract_data.py

if [ $? -ne 0 ]; then
    echo "ERROR: Data extraction failed! Check the error messages above."
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo "Data extraction completed successfully."
echo ""

echo "[2/2] Generating PDF report..."
python generate_pdf.py

if [ $? -ne 0 ]; then
    echo "ERROR: PDF generation failed! Check the error messages above."
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

echo "PDF generation completed successfully."
echo ""

echo "===== Report generation complete! ====="
echo "Output PDF is ready for review."
echo ""

echo "Press any key to exit..."
read -n 1 