#!/usr/bin/env python3
"""Sestaví návrh webu Pivnice U Ričího do site/ (obsah v _data/*.json, šablona v src/)."""
import json, os, shutil, hashlib, datetime
from jinja2 import Environment, FileSystemLoader

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'site')
D = lambda n: json.load(open(os.path.join(ROOT, '_data', n), encoding='utf-8'))
S, NAP, KUCH, ZAB, AKCE = D('site.json'), D('napoje.json'), D('kuchyne.json'), D('zabava.json'), D('akce.json')

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, 'assets'))
for n in ('style.css', 'main.js', 'favicon.svg'): shutil.copy(os.path.join(ROOT, 'src', n), os.path.join(OUT, 'assets', n))
shutil.copytree(os.path.join(ROOT, 'img'), os.path.join(OUT, 'img'))
open(os.path.join(OUT, '.nojekyll'), 'w').close()
open(os.path.join(OUT, 'robots.txt'), 'w').write('User-agent: *\nDisallow: /\n')
V = {k: hashlib.md5(open(os.path.join(OUT, 'assets', f), 'rb').read()).hexdigest()[:8] for k, f in (('css', 'style.css'), ('js', 'main.js'), ('fav', 'favicon.svg'))}

days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
LD = {
    '@context': 'https://schema.org', '@type': 'BarOrPub', 'name': S['name'], 'servesCuisine': 'Česká',
    'address': {'@type': 'PostalAddress', 'streetAddress': S['address']['street'], 'addressLocality': 'Brno', 'postalCode': '602 00', 'addressCountry': 'CZ'},
    'geo': {'@type': 'GeoCoordinates', 'latitude': S['address']['lat'], 'longitude': S['address']['lng']},
    'telephone': S['phone_href'], 'email': S['email'], 'sameAs': [S['facebook']],
    'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': days[i], 'opens': h['o'], 'closes': '23:59' if h['c'] == '24:00' else h['c']} for i, h in enumerate(S['hours'])],
}
env = Environment(loader=FileSystemLoader(os.path.join(ROOT, 'src')), autoescape=True, trim_blocks=True, lstrip_blocks=True)
from markupsafe import Markup
html = env.get_template('index.html').render(S=S, NAP=NAP, KUCH=KUCH, ZAB=ZAB, AKCE=AKCE, V=V, YEAR=datetime.date.today().year,
                                             LD=Markup(json.dumps(LD, ensure_ascii=False)), HOURS=Markup(json.dumps(S['hours'], ensure_ascii=False)))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)
nf = html.split('<main>')[0] + '<main><section class="hero"><div class="hero-in wrap"><div class="hero-txt"><p class="kicker">404</p><h1 class="h1">Tady nic <em>netočíme.</em></h1><p class="lead">Stránka neexistuje. <a class="lnk" href="/ricihi/">Zpět na úvod</a></p></div></div></section></main></body></html>'
open(os.path.join(OUT, '404.html'), 'w', encoding='utf-8').write(nf.replace('href="assets/', 'href="/ricihi/assets/'))
print('hotovo:', sum(len(f) for _, _, f in os.walk(OUT)), 'souborů')
