# generate_pdf.py

import os
import sys
import time
import http.server
import socketserver
import threading
from pathlib import Path
import webbrowser
from playwright.sync_api import sync_playwright

def start_local_server(directory, port=8000):
    """Start a simple HTTP server in a separate thread to avoid CORS issues"""
    os.chdir(directory)
    handler = http.server.SimpleHTTPRequestHandler
    server = socketserver.TCPServer(("", port), handler)
    
    print(f"Starting HTTP server at http://localhost:{port}")
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server

def generate_pdf(html_path, output_pdf=None, port=8000):
    """Generate a PDF from HTML via a local server to avoid CORS issues"""
    html_path = Path(html_path)
    
    if not html_path.exists():
        print(f"Error: HTML file {html_path} not found")
        return False
        
    # Get absolute directory containing the HTML file
    html_dir = html_path.parent.absolute()
    html_filename = html_path.name
    
    # Set default output path if none provided
    if not output_pdf:
        output_pdf = html_dir / f"{html_path.stem}.pdf"
    else:
        output_pdf = Path(output_pdf)
    
    # Start a local server in the HTML directory
    server = start_local_server(html_dir, port)
    
    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch()
            page = browser.new_page()
            
            # Load the page via HTTP server instead of file://
            url = f"http://localhost:{port}/{html_filename}"
            print(f"Loading: {url}")
            
            # Navigate to the page with generous timeout
            page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Give extra time for JavaScript to execute
            print("Waiting for dynamic content to render...")
            time.sleep(3)
            
            # Generate PDF with reduced top and bottom margins
            print(f"Generating PDF: {output_pdf}")
            page.pdf(
                path=str(output_pdf),
                format='Letter',
                margin={
                    'top': '0.25in',     # Reduced from 0.5in
                    'right': '0.5in',    # Kept the same
                    'bottom': '0.25in',  # Reduced from 0.5in
                    'left': '0.5in'      # Kept the same
                },
                print_background=True
            )
            
            browser.close()
            
        print(f"PDF successfully generated at: {output_pdf}")
        return True
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return False
    finally:
        # Shut down the server
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        html_path = sys.argv[1]
        output_pdf = None
        
        if len(sys.argv) > 2:
            output_pdf = sys.argv[2]
            
        generate_pdf(html_path, output_pdf)
    else:
        # If no path provided, use default path
        html_path = "report.html"
        generate_pdf(html_path)