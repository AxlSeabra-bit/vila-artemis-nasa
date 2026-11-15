"""Derive compact educational data from archived public NASA products.
No interpolation into real geography. Quantities and simulation time are game units.
Run with Python, Pillow, pypdfium2. Sources and pixel coordinates are retained.
"""
import json, hashlib, math
from pathlib import Path
from PIL import Image
import pypdfium2 as pdfium

root = Path(__file__).resolve().parent.parent
raw, out = root / 'data/raw', root / 'public/data'
out.mkdir(parents=True, exist_ok=True)
def save(name, data):
    content=json.dumps(data, ensure_ascii=False, indent=2)+'\n'
    (out/name).write_text(content, encoding='utf-8')
    derived=root/'data/derived'
    derived.mkdir(exist_ok=True)
    (derived/name).write_text(content, encoding='utf-8')

ice = Image.open(raw/'moon-south-ice.png').convert('RGB')
ice.save(out/'moon-south-ice.png')
# Original circular map is inset in a white page. Keep this rectangle in provenance.
ice_box = (0, 55, 934, 983)
pixels = ice.load()
candidates = []
for gy in range(3,25):
    for gx in range(3,25):
        # Map the published illustration to a 28 x 28 SCHEMATIC, not a georeferenced grid.
        xa, xb = int(gx*934/28), int((gx+1)*934/28)
        ya, yb = int(55+gy*928/28), int(55+(gy+1)*928/28)
        cyan = [(x,y) for y in range(ya,yb) for x in range(xa,xb)
                if (lambda c:c[1]>c[0]+35 and c[2]>c[0]+35 and min(c[1],c[2])>80)(pixels[x,y])]
        if cyan and not (9<=gx<=18 and 11<=gy<=17):
            candidates.append(dict(x=gx,y=gy,sourcePixel=list(cyan[len(cyan)//2]),bluePixels=len(cyan)))
selected=[]
for c in sorted(candidates,key=lambda c:(-c['bluePixels'],c['y'],c['x'])):
    if all(math.hypot(c['x']-d['x'],c['y']-d['y'])>=3 for d in selected):
        selected.append(dict(id=f'm3-{len(selected)+1}',**c))
    if len(selected)==8: break
assert len(selected)==8

pdf=pdfium.PdfDocument(raw/'lunar-radiation-model.pdf')
page=pdf[1].render(scale=2).to_pil().convert('RGB')
# Figure 3, including legend, at 2x PDF coordinates. This is an archived MODEL.
rad_box=(149,145,595,510)
figure=page.crop(rad_box)
figure.save(out/'lunar-radiation-model.png')
# The legend is sampled directly from the rendered figure, avoiding an invented palette.
# Native page coordinates derived from visual inspection: horizontal Fig 4 legend.
legend=[page.getpixel((x,1284)) for x in range(704,1055)]
# Select three well inside circular Figure 3. Approximate values digitized against the legend.
rad_samples=[]
scan=[]
for y in range(35,320,3):
    for x in range(35,320,3):
        if math.hypot(x-180,y-185)>140: continue
        color=figure.getpixel((x,y))
        if max(color)-min(color)<120: continue
        i=min(range(len(legend)),key=lambda j:sum((color[k]-legend[j][k])**2 for k in range(3)))
        error=sum((color[k]-legend[i][k])**2 for k in range(3))
        if error<1000: scan.append((i,x,y))
scan.sort()
for sid,(_,x,y) in zip(['terrain-a','terrain-b','terrain-c'],[scan[0],scan[len(scan)//2],scan[-1]]):
    rgb=figure.getpixel((x,y))
    idx=min(range(len(legend)),key=lambda i:sum((rgb[k]-legend[i][k])**2 for k in range(3)))
    dose=round((3000+1800*idx/(len(legend)-1))/100)*100
    rad_samples.append(dict(id=sid,sourcePixel=[x,y],approxModelCgy=dose,relativeExposure=round(dose/4800,3),rgb=rgb))

donki=json.loads((raw/'donki-2024-05.json').read_text(encoding='utf-8'))
assert isinstance(donki,list) and len(donki)>0
alerts=[]
for row in donki:
    if row['messageType'] not in ['SEP','FLR','CME','GST','RBE']: continue
    # Preserve identifiers and source URLs. Avoid reproducing full notification bodies.
    alerts.append(dict(id=row['messageID'],messageType=row['messageType'],issueTime=row['messageIssueTime'],
                       sourceUrl=row['messageURL'],summary=f"NASA DONKI: {row['messageType']} ({row['messageIssueTime'][:10]})",
                       severity=3 if row['messageType']=='SEP' else 2 if row['messageType'] in ['CME','FLR'] else 1,
                       source='archive'))
alerts=sorted(alerts,key=lambda a:a['issueTime'],reverse=True)
save('donki-archive.json',alerts)

rad=json.loads((raw/'radlab-iss.json').read_text(encoding='utf-8'))
records=[dict(zip(rad['columns'],r)) for r in rad['data']]
assert all(isinstance(r['absorbed_dose_rate'],(int,float)) and r['spacecraft']=='ISS' for r in records)
save('radlab-iss.json',{'unit':'µGy/h','records':records,'environment':'ISS, órbita da Terra, não Lua'})
manifest={
    'version':1,'retrievedOn':'2026-11-15','iceSites':selected,'radiationSamples':rad_samples,
    'ice':{'source':'https://www.usgs.gov/media/images/moons-south-pole-image-water-icepng',
           'scienceSource':'https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/',
           'credit':'NASA M³ / Chandrayaan-1 (ISRO), divulgação 2018, cópia USGS de domínio público',
           'imageSize':list(ice.size),'crop':ice_box,'method':'Cyan pixels: G>R+35, B>R+35, min(G,B)>80; eight separated cells. Schematic, not georeferenced. No ice concentration or excavation yield inferred.'},
    'radiation':{'source':'https://ntrs.nasa.gov/citations/20240004047','credit':'Phipps et al., LPSC 2024, Fig. 3',
                 'method':'Three pixels digitized by nearest legend color, rounded to 100 cGy. Relative factor = approximate model dose / 4800. Not a dosimeter or current lunar forecast.',
                 'assumptions':'Primary proton dose model, October 1989 SEP scenario, water target, 1 mm aluminum; LOLA 128 ppd terrain. Does not establish safe areas. Maps not co-registered.',
                 'figureCrop2x':rad_box},
    'files':{p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in raw.iterdir() if p.is_file()}
}
save('science-manifest.json',manifest)
print(json.dumps({'iceSites':selected,'radiationSamples':rad_samples,'donki':len(alerts),'radlab':len(records)},ensure_ascii=False,indent=2))
