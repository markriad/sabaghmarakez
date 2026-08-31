"""Every count and figure on the site, checked against the source it came from.

Run after adding or removing a project — counts stated in prose go stale
silently, which is how "Three residential communities" survived a fourth
project being added.
"""
import pathlib, re, json

ok=[]; bad=[]
def chk(what, passed, detail=""):
    (ok if passed else bad).append(f"{what}  {detail}")

s=pathlib.Path('index.html').read_text(encoding='utf-8')
b=s[s.index('</style>'):]

# ── counts that must match what is actually on the page ──
cards=len(re.findall(r'class="projcard[ "]', b))
m=re.search(r'\b(One|Two|Three|Four|Five|Six)\s+communities', b)
WORD={'One':1,'Two':2,'Three':3,'Four':4,'Five':5,'Six':6}
# Stating no count is the safe state — a number in prose goes stale silently
# the moment a project is added, which is exactly what happened twice.
chk("cards intro states no stale count",
    (not m) or WORD[m.group(1)]==cards,
    f"shows {cards} cards" + (f", prose says {m.group(1)}" if m else ", prose states no count"))

panels=re.findall(r'<div class="gp" id="g\d"[^>]*>(.*?)\n          </div>', b, re.S)
listed=sum(len(re.findall(r'<span class="rn">', p)) for p in panels)
m2=re.search(r'\b(Fifteen|Sixteen|Seventeen|\d+)\s+developments in (five|six|\d+) categories', b)
NUM={'Fifteen':15,'Sixteen':16,'Seventeen':17,'five':5,'six':6}
claimed=NUM.get(m2.group(1), None) if m2 else None
if claimed is None and m2: claimed=int(m2.group(1))
chk("portfolio total matches the rows listed",
    claimed==listed, f"claims {claimed}, lists {listed}")
cats=NUM.get(m2.group(2)) if m2 else None
if cats is None and m2: cats=int(m2.group(2))
chk("portfolio categories match the groups",
    cats==len(panels), f"claims {cats}, has {len(panels)}")

# ── every group summary must name what its rows contain ──
names=re.findall(r'<h3>([^<]+)</h3>\s*<span class="gsum">([^<]*)</span>', b)
for (gname,summ),pan in zip(names,panels):
    rows=[re.sub(r'&amp;','&',x) for x in re.findall(r'<span class="rn">([^<]+)</span>', pan)]
    plain=re.sub(r'&middot;|&nbsp;',' ',summ)
    # summaries abbreviate deliberately: "Mall of Arabia" appears as "Arabia"
    def key(name):
        n=re.sub(r'^(Mall of|The)\s+','',name).strip()
        return n.split()[0]
    missing=[r for r in rows if key(r) not in plain]
    chk(f"summary lists its rows · {gname}", not missing, f"missing {missing}" if missing else "")

# ── the hero fact must match the projects that exist ──
import json as _json
home=_json.loads(pathlib.Path('content/home.json').read_text(encoding='utf-8'))
fact=next((f for f in home.get('heroFacts',[])
           if 'residential' in (f.get('label') or '')), None)
NUMW={'One':1,'Two':2,'Three':3,'Four':4,'Five':5,'Six':6}
projects=len(re.findall(r'class="projcard[ "]', b))
chk("hero fact 'residential projects' matches the cards",
    bool(fact) and NUMW.get(fact['value'])==projects,
    f"says {fact['value'] if fact else '?'}, {projects} projects shown")

# ── residential areas must all use the same unit ──
rows=re.findall(r'<span class="rn">([^<]+)</span>.*?<span class="rs">([^<]*)</span>',
                b[b.index('id="g1"'):b.index('id="g2"')], re.S)
units=[(n,v) for n,v in rows if re.search(r'\d', v)]
odd=[f"{n}: {v}" for n,v in units if 'acre' not in v.lower()]
chk("every residential row states its area in acres", not odd, "; ".join(odd))
chk("no feddans anywhere in the English copy", 'feddan' not in b.lower())

# ── 404 must list every real page ──
pages=[p.name for p in pathlib.Path('.').glob('*.html')
       if p.name not in ('404.html','thank-you.html')]
f404=pathlib.Path('404.html').read_text(encoding='utf-8')
W={3:'three',4:'four',5:'five',6:'six'}
chk("404 page count", W.get(len(pages),'?') in f404.lower(),
    f"{len(pages)} pages exist")
for pg in pages:
    if pg=='index.html': continue
    chk(f"404 links to {pg}", pg in f404)

# ── figures verified against the brochures ──
SOURCED={'621,401 sqm':'Mall of Arabia, e-brochure','155,000 sqm':'Mall of Mansoura, e-brochure',
 '35,000 sqm':'Mall of Tanta leasable, e-brochure','64,000 sqm':'Town Center, e-brochure',
 '34,000 sqm':'The Park, e-brochure','21 acres':'Aeon, e-brochure',
 '62.5 MW':'FAS Energy Benban, e-brochure','1.4 km':'Ramla brochure',
 '118 acres':'Crescent Walk brochure','268 acres':'D5 brochure',
 '83 acres':'Shams Soma technical brochure — 80 feddans converted; the site states every residential area in acres','106,000 sqm':'Mindhaus Campus, e-brochure'}
for fig,src in SOURCED.items():
    chk(f"{fig} present and sourced", fig in b or fig.replace(' ','&nbsp;') in b, src)

w=max(len(x.split('  ')[0]) for x in ok+bad) if ok+bad else 40
for line in ok:  print(f"  ok   {line}")
for line in bad: print(f"  FAIL {line}")
print()
print(f"{len(bad)} problem(s)" if bad else f"all {len(ok)} checks pass")
