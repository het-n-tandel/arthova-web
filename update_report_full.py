#!/usr/bin/env python3
"""
update_report_full.py
Embeds real PNG figures, structures sections:
- Pages 1-3: NO header, NO footer
- Preliminary pages: Lowercase Roman numerals (i, ii, iii, iv, v)
- Chapter 1 onwards: Arabic numerals starting at Page 1
Ensures every chapter starts on a new page with zero empty pages.
"""

import re
import os
import shutil
import zipfile
import subprocess

MD_FILE = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.md"
DOCX_FILE = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.docx"
HTML_FILE = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.html"

def update_markdown():
    with open(MD_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace ASCII art for Figure 1
    content = re.sub(
        r'\+---------------------------------------------------------------------------------\+.*?\|\s+TAX ENGINE\s+\|.*?\+---------------------------------------------------------------------------------\+\n\*Figure 1:[^\n]+\*',
        '![Figure 1: Comparison between fragmented traditional retail tracking and Arthova\'s unified institutional architecture](figures/fig1_architecture.png)\n\n*Figure 1: Comparison between fragmented traditional retail tracking and Arthova\'s unified institutional architecture.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 2
    content = re.sub(
        r'```\s+Expected\s+Return E\[R\].*?\+--------------------------------------------> Volatility \(Risk\) σ\s+```\n\*Figure 2:[^\n]+\*',
        '![Figure 2: The Markowitz Efficient Frontier illustrating risk-return optimization](figures/fig2_efficient_frontier.png)\n\n*Figure 2: The Markowitz Efficient Frontier illustrating risk-return optimization.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 3
    content = re.sub(
        r'\+-----------------------------------------------------------------------------------\+.*?PURGED WALK-FORWARD TIME-SERIES SPLIT.*?ZERO LOOKAHEAD LEAKAGE ACROSS TIME BOUNDARIES.*?\+-----------------------------------------------------------------------------------\+\n\*Figure 3:[^\n]+\*',
        '![Figure 3: Purged Walk-Forward Time-Series Split used in Arthova to prevent lookahead bias](figures/fig3_purged_walk_forward.png)\n\n*Figure 3: Purged Walk-Forward Time-Series Split used in Arthova to prevent lookahead bias.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 4
    content = re.sub(
        r'```\s+\[ Raw Market Data \(OHLCV \+ Financials\) \].*?Live Order Trigger.*?\n```\n\*Figure 4:[^\n]+\*',
        '![Figure 4: End-to-end multi-signal hybrid framework pipeline in Arthova](figures/fig4_pipeline.png)\n\n*Figure 4: End-to-end multi-signal hybrid framework pipeline in Arthova.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 5
    content = re.sub(
        r'```\s+Loss\s+1\.2 \| \*.*?0        20        40        60        80        100\s+```\n\*Figure 5:[^\n]+\*',
        '![Figure 5: 100-Epoch supervised neural network training and validation loss convergence](figures/fig5_loss_convergence.png)\n\n*Figure 5: 100-Epoch supervised neural network training and validation loss convergence.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 6
    content = re.sub(
        r'```\s+Portfolio\s+Value.*?2018      2019       2020 \(Crash\)   2022      2024    2025\s+```\n\*Figure 6:[^\n]+\*',
        '![Figure 6: Portfolio drawdown trajectory comparing Arthova\'s hybrid model against passive Nifty 50](figures/fig6_drawdown.png)\n\n*Figure 6: Portfolio drawdown trajectory comparing Arthova\'s hybrid model against passive Nifty 50.*',
        content, flags=re.DOTALL
    )

    # Replace ASCII art for Figure 7
    content = re.sub(
        r'```\s+Portfolio\s+Value \(₹\).*?0       3       6       9       12      15      20\s+```\n\*Figure 7:[^\n]+\*',
        '![Figure 7: Interactive SIP compounding trajectory illustrating exponential wealth accumulation](figures/fig7_sip_compounding.png)\n\n*Figure 7: Interactive SIP compounding trajectory illustrating exponential wealth accumulation.*',
        content, flags=re.DOTALL
    )

    # Now handle Section 1: Candidate Declaration and Certificate combined cleanly on Page 3
    # Look for Candidate Declaration and Certificate
    # Let's ensure Page 1: Cover, Page 2: AI Disclosure, Page 3: Declaration & Certificate
    # Remove the page break between Declaration and Certificate so they occupy Page 3
    content = re.sub(
        r'(## Candidate’s Declaration.*?)(```{=openxml}\n<w:p><w:r><w:br w:type="page"/>.*?\n```\n<div style="page-break-before: always;"></div>\n+)(## CERTIFICATE)',
        r'\1\n<br>\n\3',
        content, flags=re.DOTALL
    )

    # Add section tags for our post-processor
    # Mark Section 2 start before Acknowledgment: <!-- SECTION_BREAK_ROMAN -->
    content = re.sub(
        r'(```{=openxml}\n<w:p><w:r><w:br w:type="page"/>.*?\n```\n<div style="page-break-before: always;"></div>\n+)(## Acknowledgment)',
        r'<!-- SECTION_BREAK_ROMAN -->\n\1\2',
        content
    )

    # Mark Section 3 start before Chapter 1: <!-- SECTION_BREAK_ARABIC -->
    content = re.sub(
        r'(```{=openxml}\n<w:p><w:r><w:br w:type="page"/>.*?\n```\n<div style="page-break-before: always;"></div>\n+)(# CHAPTER 1: INTRODUCTION)',
        r'<!-- SECTION_BREAK_ARABIC -->\n\1\2',
        content
    )

    with open(MD_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    print("Updated markdown with real PNG figures and section markers.")

def compile_pandoc():
    print("Compiling DOCX via pandoc...")
    subprocess.run(["pandoc", MD_FILE, "-o", DOCX_FILE], check=True)

    print("Compiling HTML via pandoc...")
    subprocess.run(["pandoc", "-s", "--css", "report_style.css", "--mathjax", MD_FILE, "-o", HTML_FILE], check=True)

def inject_docx_sections():
    print("Configuring 3-Section OpenXML in DOCX...")
    EXTRACT_DIR = "docx_sect_temp"
    if os.path.exists(EXTRACT_DIR):
        shutil.rmtree(EXTRACT_DIR)

    with zipfile.ZipFile(DOCX_FILE, 'r') as zin:
        zin.extractall(EXTRACT_DIR)

    word_dir = os.path.join(EXTRACT_DIR, "word")

    # Header XML (common across Sec 2 and Sec 3)
    header_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="6" w:space="6" w:color="CBD5E1"/>
      </w:pBdr>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
      <w:spacing w:after="160"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>ARTHOVA: Quantitative Portfolio Intelligence &amp; Wealth Advisory Platform</w:t>
    </w:r>
    <w:r><w:tab/></w:r>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t>B. Tech. Project-2 | DDU IT</w:t>
    </w:r>
  </w:p>
</w:hdr>"""

    # Footer Roman XML (for prelims: i, ii, iii...)
    footer_roman_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:pBdr>
        <w:top w:val="single" w:sz="6" w:space="6" w:color="CBD5E1"/>
      </w:pBdr>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
      <w:spacing w:before="160"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t>Department of Information Technology, Dharmsinh Desai University, Nadiad</w:t>
    </w:r>
    <w:r><w:tab/></w:r>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:b/>
        <w:sz w:val="18"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
      <w:t>Page </w:t>
    </w:r>
    <w:fldSimple w:instr="PAGE">
      <w:r>
        <w:rPr>
          <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:sz w:val="18"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t>i</w:t>
      </w:r>
    </w:fldSimple>
  </w:p>
</w:ftr>"""

    # Footer Arabic XML (for Chapter 1 onwards: 1, 2, 3...)
    footer_arabic_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Footer"/>
      <w:pBdr>
        <w:top w:val="single" w:sz="6" w:space="6" w:color="CBD5E1"/>
      </w:pBdr>
      <w:tabs>
        <w:tab w:val="right" w:pos="9360"/>
      </w:tabs>
      <w:spacing w:before="160"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t>Department of Information Technology, Dharmsinh Desai University, Nadiad</w:t>
    </w:r>
    <w:r><w:tab/></w:r>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:b/>
        <w:sz w:val="18"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
      <w:t>Page </w:t>
    </w:r>
    <w:fldSimple w:instr="PAGE">
      <w:r>
        <w:rPr>
          <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:b/>
          <w:sz w:val="18"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t>1</w:t>
      </w:r>
    </w:fldSimple>
  </w:p>
</w:ftr>"""

    with open(os.path.join(word_dir, "header1.xml"), "w", encoding="utf-8") as f:
        f.write(header_xml)
    with open(os.path.join(word_dir, "footer1.xml"), "w", encoding="utf-8") as f:
        f.write(footer_roman_xml)
    with open(os.path.join(word_dir, "footer2.xml"), "w", encoding="utf-8") as f:
        f.write(footer_arabic_xml)

    # Update [Content_Types].xml
    ct_path = os.path.join(EXTRACT_DIR, "[Content_Types].xml")
    with open(ct_path, "r", encoding="utf-8") as f:
        ct_content = f.read()

    h_override = '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
    f1_override = '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    f2_override = '<Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'

    for ov in [h_override, f1_override, f2_override]:
        if ov not in ct_content:
            ct_content = ct_content.replace('</Types>', f'  {ov}\n</Types>')
    with open(ct_path, "w", encoding="utf-8") as f:
        f.write(ct_content)

    # Update word/_rels/document.xml.rels
    rels_path = os.path.join(word_dir, "_rels", "document.xml.rels")
    with open(rels_path, "r", encoding="utf-8") as f:
        rels_content = f.read()

    rel_h = '<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
    rel_f1 = '<Relationship Id="rIdFooterRoman" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
    rel_f2 = '<Relationship Id="rIdFooterArabic" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>'

    for rel in [rel_h, rel_f1, rel_f2]:
        if rel not in rels_content:
            rels_content = rels_content.replace('</Relationships>', f'  {rel}\n</Relationships>')
    with open(rels_path, "w", encoding="utf-8") as f:
        f.write(rels_content)

    # Update word/document.xml
    doc_path = os.path.join(word_dir, "document.xml")
    with open(doc_path, "r", encoding="utf-8") as f:
        doc_xml = f.read()

    # Section 1 Break: right before Acknowledgment
    # We want a section break that defines Section 1 (no header, no footer)
    # OpenXML for section 1 break:
    # <w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>
    sec1_break = '<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>'
    
    # Section 2 Break: right before Chapter 1
    # We want a section break that defines Section 2 (header1 + footerRoman, roman numbering starting at i)
    sec2_break = '<w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="default" r:id="rIdFooterRoman"/><w:pgNumType w:fmt="lowerRoman" w:start="1"/></w:sectPr></w:pPr></w:p>'

    # Section 3: The document ending sectPr (Arabic decimal starting at 1)
    final_sect_pr = '<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="default" r:id="rIdFooterArabic"/><w:pgNumType w:fmt="decimal" w:start="1"/></w:sectPr>'

    # Find Acknowledgment heading in document.xml
    # Replace the paragraph break before Acknowledgment with sec1_break
    # In docx, Acknowledgment heading is: <w:t>Acknowledgment</w:t>
    ack_match = re.search(r'(<w:p[^>]*>.*?<w:t[^>]*>Acknowledgment</w:t>.*?</w:p>)', doc_xml)
    if ack_match:
        doc_xml = doc_xml[:ack_match.start()] + sec1_break + doc_xml[ack_match.start():]
        print("Inserted Section 1 Break before Acknowledgment.")

    # Find CHAPTER 1 heading in document.xml
    # Replace before CHAPTER 1 with sec2_break
    ch1_match = re.search(r'(<w:p[^>]*>.*?<w:t[^>]*>CHAPTER 1: INTRODUCTION</w:t>.*?</w:p>)', doc_xml)
    if ch1_match:
        doc_xml = doc_xml[:ch1_match.start()] + sec2_break + doc_xml[ch1_match.start():]
        print("Inserted Section 2 Break before Chapter 1.")

    # Replace the final <w:sectPr...> at the end of body with final_sect_pr
    doc_xml = re.sub(r'<w:sectPr[^>]*>.*?</w:sectPr>', final_sect_pr, doc_xml)
    print("Configured final Section 3 properties (Arabic numbering starting at Page 1).")

    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(doc_xml)

    # Re-zip
    tmp_out = "ARTHOVA_FINAL_TEMP.docx"
    with zipfile.ZipFile(tmp_out, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(EXTRACT_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, EXTRACT_DIR)
                zout.write(full_path, rel_path)

    shutil.move(tmp_out, DOCX_FILE)
    shutil.rmtree(EXTRACT_DIR)
    print("DOCX successfully re-packaged with 3 distinct sections!")

if __name__ == "__main__":
    update_markdown()
    compile_pandoc()
    inject_docx_sections()
    print("All tasks completed successfully!")
