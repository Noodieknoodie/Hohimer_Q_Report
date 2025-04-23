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
    os.chdir(directory)
    handler = http.server.SimpleHTTPRequestHandler
    server = socketserver.TCPServer(("", port), handler)
    print(f"Starting HTTP server at http://localhost:{port}")
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server

def generate_pdf(html_path, output_pdf=None, port=8000):
    html_path = Path(html_path)
    if not html_path.exists():
        print(f"Error: HTML file {html_path} not found")
        return False

    html_dir = html_path.parent.absolute()
    html_filename = html_path.name

    if not output_pdf:
        output_pdf = html_dir / f"{html_path.stem}.pdf"
    else:
        output_pdf = Path(output_pdf)

    server = start_local_server(html_dir, port)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            context = browser.new_context(viewport={'width': 1200, 'height': 1553})  # Letter size in pixels
            page = context.new_page()
            url = f"http://localhost:{port}/{html_filename}"
            print(f"Loading: {url}")
            page.goto(url, wait_until='networkidle', timeout=60000) # Increased timeout
            print("Waiting for dynamic content to render...")
            page.wait_for_timeout(5000) # Increased wait time

            print(f"Generating PDF: {output_pdf}")
            # Ensuring no blank pages and proper rendering
            page.pdf(
                path=str(output_pdf),
                format='Letter',
                margin={
                    'top': '0in',
                    'right': '0in',
                    'bottom': '0in',
                    'left': '0in'
                },
                print_background=True,
                display_header_footer=False,
                prefer_css_page_size=True,
                scale=1.0
            )
            browser.close()
        print(f"PDF successfully generated at: {output_pdf}")
        return True
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return False
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        html_path_arg = sys.argv[1]
        output_pdf_arg = None
        if len(sys.argv) > 2:
            output_pdf_arg = sys.argv[2]
        generate_pdf(html_path_arg, output_pdf_arg)
    else:
        generate_pdf("report.html")