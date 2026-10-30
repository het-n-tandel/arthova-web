#!/usr/bin/env python3
"""
format_docx_report.py
Injects professional headers, footers with dynamic page numbers, 
and enhanced styling into the generated Word document (.docx).
"""

import zipfile
import re
import os
import shutil

DOCX_IN = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.docx"
DOCX_OUT = "ARTHOVA_FINAL_PROJECT_REPORT_DDU.docx"
EXTRACT_DIR = "docx_temp_extracted"

HEADER_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
        <w:szCs w:val="18"/>
        <w:color w:val="475569"/>
      </w:rPr>
      <w:t>ARTHOVA: Quantitative Portfolio Intelligence &amp; Wealth Advisory Platform</w:t>
    </w:r>
    <w:r>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t>B. Tech. Project-2 | DDU IT</w:t>
    </w:r>
  </w:p>
</w:hdr>
"""

FOOTER_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
        <w:szCs w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t>Department of Information Technology, Dharmsinh Desai University, Nadiad</w:t>
    </w:r>
    <w:r>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:b/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
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
          <w:szCs w:val="18"/>
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t>1</w:t>
      </w:r>
    </w:fldSimple>
    <w:r>
      <w:rPr>
        <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="64748B"/>
      </w:rPr>
      <w:t> of </w:t>
    </w:r>
    <w:fldSimple w:instr="NUMPAGES">
      <w:r>
        <w:rPr>
          <w:rFont w:ascii="Calibri" w:hAnsi="Calibri"/>
          <w:sz w:val="18"/>
          <w:szCs w:val="18"/>
          <w:color w:val="64748B"/>
        </w:rPr>
        <w:t>45</w:t>
      </w:r>
    </w:fldSimple>
  </w:p>
</w:ftr>
"""

def process():
    if os.path.exists(EXTRACT_DIR):
        shutil.rmtree(EXTRACT_DIR)
        
    with zipfile.ZipFile(DOCX_IN, 'r') as zin:
        zin.extractall(EXTRACT_DIR)
        
    word_dir = os.path.join(EXTRACT_DIR, "word")
    
    # 1. Write header1.xml and footer1.xml
    with open(os.path.join(word_dir, "header1.xml"), "w", encoding="utf-8") as f:
        f.write(HEADER_XML)
    with open(os.path.join(word_dir, "footer1.xml"), "w", encoding="utf-8") as f:
        f.write(FOOTER_XML)
        
    # 2. Update [Content_Types].xml
    ct_path = os.path.join(EXTRACT_DIR, "[Content_Types].xml")
    with open(ct_path, "r", encoding="utf-8") as f:
        ct_content = f.read()
        
    header_override = '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
    footer_override = '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    
    if '/word/header1.xml' not in ct_content:
        ct_content = ct_content.replace('</Types>', f'  {header_override}\n  {footer_override}\n</Types>')
        with open(ct_path, "w", encoding="utf-8") as f:
            f.write(ct_content)
            
    # 3. Update word/_rels/document.xml.rels
    doc_rels_path = os.path.join(word_dir, "_rels", "document.xml.rels")
    with open(doc_rels_path, "r", encoding="utf-8") as f:
        doc_rels = f.read()
        
    rel_header = '<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'
    rel_footer = '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
    
    if 'Target="header1.xml"' not in doc_rels:
        doc_rels = doc_rels.replace('</Relationships>', f'  {rel_header}\n  {rel_footer}\n</Relationships>')
        with open(doc_rels_path, "w", encoding="utf-8") as f:
            f.write(doc_rels)
            
    # 4. Update word/document.xml section properties to link header, footer, and hide on title page
    doc_path = os.path.join(word_dir, "document.xml")
    with open(doc_path, "r", encoding="utf-8") as f:
        doc_xml = f.read()
        
    # Find all <w:sectPr ...>
    # We want to insert headerReference and footerReference into sectPr
    header_ref = '<w:headerReference w:type="default" r:id="rIdHeader1"/>'
    footer_ref = '<w:footerReference w:type="default" r:id="rIdFooter1"/>'
    title_pg = '<w:titlePg/>' # Suppresses header/footer on first page
    
    def repl_sect_pr(m):
        content = m.group(1)
        # Check if already present
        if 'rIdHeader1' not in content:
            content = f'{header_ref}\n{footer_ref}\n{title_pg}\n' + content
        return f'<w:sectPr{m.group(0)[9:]}' # preserve attributes if any
        
    # Pattern to match sectPr tags
    if '<w:sectPr' in doc_xml:
        # Simple injection right after each <w:sectPr...>
        doc_xml = re.sub(
            r'(<w:sectPr[^>]*>)',
            r'\1' + f'{header_ref}{footer_ref}{title_pg}',
            doc_xml
        )
        with open(doc_path, "w", encoding="utf-8") as f:
            f.write(doc_xml)
            
    # 5. Pack back into docx
    tmp_out = "ARTHOVA_FORMATTED_TEMP.docx"
    with zipfile.ZipFile(tmp_out, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(EXTRACT_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, EXTRACT_DIR)
                zout.write(full_path, rel_path)
                
    shutil.move(tmp_out, DOCX_OUT)
    shutil.rmtree(EXTRACT_DIR)
    print("Successfully formatted and injected headers/footers into:", DOCX_OUT)

if __name__ == "__main__":
    process()
