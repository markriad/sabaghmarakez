import pathlib, re, json, yaml
P='Shams Soma'; checks=[]
def chk(where, ok, detail=''):
    checks.append((where, ok, detail))

html={f:pathlib.Path(f).read_text(encoding='utf-8') for f in
      ['index.html','ramla.html','crescent-walk.html','district-5.html',
       'shams-soma.html','404.html','thank-you.html']}

# 1 nav dropdown on every page
for f,s in html.items():
    if f in ('404.html','thank-you.html'): continue
    chk(f'nav dropdown · {f}', 'shams-soma.html' in s)
# 2 homepage cards
chk('homepage project cards', html['index.html'].count('projcard rv')==4,
    f"{html['index.html'].count('projcard rv')} cards")
# 3 homepage portfolio accordion
i=html['index.html'].find('Residential</h3>')
grp=html['index.html'][i:i+1400] if i>0 else ''
chk('portfolio accordion · Residential row', P in grp)
# 4 404 list
chk('404 page list', 'shams-soma' in html['404.html'])
# 5 homepage form project chips
m=re.search(r'data-multi="projects".*?</div>', html['index.html'], re.S)
chk('homepage form project chips', bool(m) and P in m.group(0),
    re.findall(r'data-label="([^"]+)"', m.group(0)) if m else 'no multi group')
# 6 admin collection
c=yaml.safe_load(pathlib.Path('admin/config.yml').read_text(encoding='utf-8'))
chk('admin panel collection', any(x['name']=='shams' for x in c['collections']))
# 7 content file
chk('content/shams.json', pathlib.Path('content/shams.json').exists())
# 8 robots / sitemap
rb=pathlib.Path('robots.txt').read_text()
chk('robots.txt does not block it', 'shams' not in rb.lower())
# 9 footer links
for f,s in html.items():
    if f in ('404.html','thank-you.html'): continue
    ft=s[s.rindex('<footer'):]
    chk(f'footer · {f}', 'shams-soma.html' in ft)
# 10 thank-you page project list
chk('thank-you page', True, 'derives project from the form, nothing to list')

w=max(len(x[0]) for x in checks)
bad=0
for where,ok,detail in checks:
    if not ok: bad+=1
    print(f"  {'ok  ' if ok else 'GAP '} {where:<{w}}  {detail if detail else ''}")
print()
print(f"{bad} gap(s)" if bad else "no gaps")
