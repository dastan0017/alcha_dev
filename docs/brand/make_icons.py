from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

font = instantiateVariableFont(TTFont('GolosText.ttf'), {'wght': 800})
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm

def glyph(ch):
    name = cmap[ord(ch)]
    pen = SVGPathPen(gs); gs[name].draw(pen)
    bp = BoundsPen(gs); gs[name].draw(bp)
    return pen.getCommands(), bp.bounds, gs[name].width

a_path, a_b, a_w = glyph('a')
d_path, d_b, d_w = glyph('.')
PURPLE, LILAC, WHITE = '#5B34C9', '#C4B0FF', '#FFFFFF'

def svg(size=512, radius=112, full_bleed=False):
    # Lay out "a." as one word (advance widths), then scale + centre the ink box.
    x0 = a_b[0]; x1 = a_w + d_b[2]
    y0 = min(a_b[1], d_b[1]); y1 = max(a_b[3], d_b[3])
    ink_w, ink_h = x1 - x0, y1 - y0
    target_h = size * 0.50          # x-height glyph: 50% of the tile
    s = target_h / ink_h
    tx = (size - ink_w * s) / 2 - x0 * s
    ty = (size + ink_h * s) / 2 + y0 * s   # flip y: font units are y-up
    rx = 0 if full_bleed else radius
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
<rect width="{size}" height="{size}" rx="{rx}" fill="{PURPLE}"/>
<g transform="translate({tx:.2f} {ty:.2f}) scale({s:.5f} {-s:.5f})">
<path fill="{WHITE}" d="{a_path}"/>
<path fill="{LILAC}" transform="translate({a_w} 0)" d="{d_path}"/>
</g>
</svg>'''

open('icon.svg','w').write(svg())
open('icon-full.svg','w').write(svg(full_bleed=True))
print('ok', upm, a_b, d_b, a_w)
