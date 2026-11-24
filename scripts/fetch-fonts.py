# Downloads OFL Google Fonts (latin + cyrillic woff2) into app/vendor/fonts for offline use.
import re, os, sys, urllib.request, json
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
FAMILIES = [
 ("Montserrat","400;700;900"),("Playfair Display","400;700;900"),("Lobster","400"),("Comfortaa","400;700"),
 ("Caveat","400;700"),("Rubik","400;700;900"),("Oswald","400;700"),("Russo One","400"),("Unbounded","400;700;900"),
 ("Manrope","400;700;800"),("Prata","400"),("Marck Script","400"),("Bad Script","400"),("Amatic SC","400;700"),
 ("Yeseva One","400"),("Alegreya","400;700"),("PT Serif","400;700"),("Ubuntu","400;700"),("Nunito","400;800"),
 ("Raleway","400;800"),("Exo 2","400;800"),("Philosopher","400;700"),("Neucha","400"),("Pangolin","400"),
 ("Golos Text","400;700"),("Inter","400;700;900"),("Roboto Slab","400;700"),("Lora","400;700"),
 ("Cormorant Garamond","400;700"),("Kelly Slab","400"),("Press Start 2P","400"),("Rubik Mono One","400"),
 ("Great Vibes","400"),("Pacifico","400"),("Jura","400;700"),("Tenor Sans","400"),
]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
css_out, names = [], []
for fam, w in FAMILIES:
    url = "https://fonts.googleapis.com/css2?family=" + fam.replace(" ", "+") + ":wght@" + w + "&display=swap"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req).read().decode()
    blocks = re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
    got = 0
    for subset, block in blocks:
        if subset not in ("latin", "cyrillic"): continue
        src = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        weight = re.search(r"font-weight: (\d+)", block).group(1)
        fn = f"{fam.replace(' ', '')}-{weight}-{subset}.woff2"
        p = os.path.join(OUT, fn)
        if not os.path.exists(p):
            urllib.request.urlretrieve(src, p)
        css_out.append(block.replace(src, fn))
        got += 1
    names.append(fam)
    print(fam, got, flush=True)
open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8").write("\n".join(css_out))
json.dump(names, open(os.path.join(OUT, "fonts.json"), "w", encoding="utf-8"), ensure_ascii=False)
