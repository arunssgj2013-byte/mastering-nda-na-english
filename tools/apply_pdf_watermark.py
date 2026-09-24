#!/usr/bin/env python3
"""Apply the site watermark to any new PDF under assets/.

Idempotent for site PDFs whose first page already contains the watermark text.
Run before publishing after adding new PDF study material.
"""
from pathlib import Path
import io, math, os, sys
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

WATERMARK = "© Arun Kumar | Mastering NDA/NA English"
NEEDLE = "Arun Kumar | Mastering NDA/NA English"
ROOT = Path(__file__).resolve().parents[1] / "assets"
cache = {}

def watermark_page(width, height):
    key=(round(float(width),2),round(float(height),2))
    if key in cache:
        return cache[key]
    buf=io.BytesIO()
    c=canvas.Canvas(buf,pagesize=(float(width),float(height)))
    try: c.setFillAlpha(0.12)
    except Exception: pass
    c.setFillColor(Color(.5,.5,.5,alpha=.12))
    diag=math.hypot(float(width),float(height))
    size=max(18,min(38,diag*.035))
    c.setFont("Helvetica-Bold",size)
    c.saveState(); c.translate(float(width)/2,float(height)/2); c.rotate(45)
    c.drawCentredString(0,0,WATERMARK)
    c.restoreState(); c.save(); buf.seek(0)
    page=PdfReader(buf).pages[0]
    cache[key]=page
    return page

def already_marked(path):
    try:
        r=PdfReader(str(path))
        return bool(r.pages) and NEEDLE in (r.pages[0].extract_text() or "")
    except Exception:
        return False

def apply(path):
    if already_marked(path):
        print(f"SKIP  {path.relative_to(ROOT)}")
        return False
    r=PdfReader(str(path)); w=PdfWriter()
    for page in r.pages:
        wm=watermark_page(page.mediabox.width,page.mediabox.height)
        page.merge_page(wm); w.add_page(page)
    tmp=path.with_suffix(path.suffix+".tmp")
    with tmp.open("wb") as f: w.write(f)
    os.replace(tmp,path)
    print(f"STAMP {path.relative_to(ROOT)}")
    return True

def main():
    pdfs=sorted(ROOT.rglob("*.pdf"))
    changed=sum(1 for p in pdfs if apply(p))
    print(f"Checked {len(pdfs)} PDFs; watermarked {changed} new/unstamped PDFs.")

if __name__=="__main__": main()
