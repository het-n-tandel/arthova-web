#!/usr/bin/env python3
"""
clean_report_pages.py
Removes all mid-chapter page breaks, manual page number tags,
and ensures new chapters and preliminary sections start strictly
on a new page with ZERO empty pages.
"""

import re
import subprocess
import os

SOURCE_FILE = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.md"

PAGE_BREAK_XML = """```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```
<div style="page-break-before: always;"></div>
"""

MAJOR_SECTIONS = [
    "## Candidate Disclosure on the Use of AI Tools",
    "## Candidate’s Declaration",
    "## CERTIFICATE",
    "## Acknowledgment",
    "## Abstract",
    "## Table of Contents",
    "## List of Tables",
    "## Abbreviations",
    "# CHAPTER 1: INTRODUCTION",
    "# CHAPTER 2: BACKGROUND THEORY",
    "# CHAPTER 3: REVIEW OF LITERATURE",
    "# CHAPTER 4: ANALYSIS AND FINDINGS",
    "# CHAPTER 5: PROPOSED WORK",
    "# CHAPTER 6: CONCLUSIONS & FUTURE SCOPE",
    "# REFERENCES",
    "# RESEARCH PAPER (IEEE FORMAT)"
]

def clean():
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Remove all manual <center><b>...</b></center>
    text = re.sub(r'\n*<center><b>[^<]+</b></center>\n*', '\n\n', text)

    # 2. Remove all existing <div style="page-break...</div>
    text = re.sub(r'\n*<div style="page-break-[^>]+></div>\n*', '\n\n', text)

    # 3. Remove all raw openxml page breaks if any exist
    text = re.sub(r'```\{=openxml\}\n<w:p><w:r><w:br w:type="page"/>.*?\n```\n*', '', text, flags=re.DOTALL)

    # 4. Remove isolated '---' horizontal rules that were previously used as page dividers
    # Keep only markdown headers clean
    text = re.sub(r'\n{3,}---\n{3,}', '\n\n', text)

    # 5. Insert clean, single page breaks strictly before the major sections
    for sec in MAJOR_SECTIONS:
        pattern = re.escape(sec)
        # Check if the section exists in text
        if re.search(pattern, text):
            # Replace with PAGE_BREAK_XML followed by the section header
            text = re.sub(r'\n*' + pattern, '\n\n' + PAGE_BREAK_XML + '\n' + sec, text, count=1)

    # Clean up any excessive newlines (max 2 newlines)
    text = re.sub(r'\n{4,}', '\n\n', text)

    with open(SOURCE_FILE, "w", encoding="utf-8") as f:
        f.write(text.strip() + "\n")

    print("Cleaned markdown written successfully to", SOURCE_FILE)

    # Re-run Pandoc to generate docx
    print("Generating DOCX with Pandoc...")
    subprocess.run([
        "pandoc",
        SOURCE_FILE,
        "-o", "ARTHOVA_FINAL_PROJECT_REPORT_DDU.docx"
    ], check=True)

    # Re-inject headers, footers and page numbering
    print("Injecting headers and footers...")
    subprocess.run(["python3", "format_docx_report.py"], check=True)

    # Re-generate HTML
    print("Generating HTML...")
    subprocess.run([
        "pandoc",
        "-s",
        "--css", "report_style.css",
        "--mathjax",
        SOURCE_FILE,
        "-o", "ARTHOVA_FINAL_PROJECT_REPORT_DDU.html"
    ], check=True)

    print("Done! All formats updated without empty pages.")

if __name__ == "__main__":
    clean()
