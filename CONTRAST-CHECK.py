"""Contrast on every page at every width, not just desktop.

The old checker ran at 1440px only, which is why two mobile-only colour bugs
shipped: the hero facts strip, and then the whole mobile hero at 1.06:1.
Translucent backgrounds are composited rather than treated as opaque.
"""
import subprocess,sys,time
from playwright.sync_api import sync_playwright
PAGES=["index.html","ramla.html","crescent-walk.html","district-5.html",
       "shams-soma.html","thank-you.html","404.html"]
WIDTHS=[1440,1100,900,820,760,600,480,390,360]
JS = r"""
() => {
  const lum=c=>{const[r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
    return .2126*r+.7152*g+.0722*b};
  const parse=s=>{const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):null};
  const alphaOf=c=>{const m=c.match(/rgba?\(([^)]+)\)/);
    if(!m) return 1; const p=m[1].split(','); return p.length>3?parseFloat(p[3]):1;};
  const bgOf=el=>{
    let n=el, acc=null, accA=0;
    while(n&&n!==document.documentElement){
      const c=getComputedStyle(n).backgroundColor;
      const p=parse(c), a=alphaOf(c);
      if(p&&a>0){
        if(!acc){acc=p.slice();accA=a;}
        else{const k=(1-accA)*a;
          acc=acc.map((v,i)=>v+(p[i]-v)*k/(accA+k||1)); accA+=k;}
        if(accA>=0.999) return acc.map(Math.round);
      }
      n=n.parentElement;
    }
    if(!acc) return [255,255,255];
    const k=1-accA; return acc.map(v=>Math.round(v*accA+255*k));
  };
  const out=[];
  document.querySelectorAll('p,h1,h2,h3,h4,h5,li,span,a,button,dt,dd,label,small,em,b,strong,i,td,th,figcaption,summary')
    .forEach(el=>{
      if(!el.textContent.trim())return;
      const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
      const cs=getComputedStyle(el);
      if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<0.1)return;
      if(el.children.length && !(el.childNodes[0]||{}).nodeValue) return;
      if(parseFloat(cs.textIndent)<-100) return;      /* label swapped via ::after */
      const fg=parse(cs.color); if(!fg)return;
      const fa=alphaOf(cs.color);
      const bg=bgOf(el);
      const eff=fg.map((v,i)=>v*fa+bg[i]*(1-fa));     /* translucent text too */
      const L1=lum(eff),L2=lum(bg);
      const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
      const px=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700;
      const need=(px>=24||(px>=18.66&&bold))?3:4.5;
      if(ratio<need) out.push([el.tagName+'.'+String(el.className).split(' ')[0],
        Math.round(ratio*100)/100, need, el.textContent.trim().slice(0,30)]);
    });
  return out;
}
"""
srv=subprocess.Popen([sys.executable,"/home/claude/cfserver.py","/home/claude/site","9450"],
                     stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1.2); bad=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for pn in PAGES:
        for w in WIDTHS:
            pg=b.new_page(viewport={"width":w,"height":900})
            pg.goto(f"http://localhost:9450/{pn}",wait_until="networkidle")
            pg.evaluate("() => document.fonts.ready")
            pg.evaluate("()=>document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'))")
            for y in range(0,7000,700): pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(25)
            pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(500)
            for c in pg.evaluate(JS):
                bad.append(f"{pn} @{w} {c[0]} {c[1]}:1 (needs {c[2]}) — {c[3]!r}")
            pg.close()
    b.close()
srv.terminate()
if bad:
    for x in sorted(set(bad))[:14]: print("  - "+x)
    print(f"\n{len(set(bad))} contrast failure(s)")
else:
    print(f"CONTRAST CLEAN — {len(PAGES)} pages x {len(WIDTHS)} widths")
