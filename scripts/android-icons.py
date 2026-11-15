"""Reuse the v3 pixel-art icon in Android launcher resources."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
res = root / 'android/app/src/main/res'
icon = Image.open(root / 'public/icons/icon-maskable-512.png').convert('RGBA')
for density, size, fg_size in [('mdpi',48,108),('hdpi',72,162),('xhdpi',96,216),('xxhdpi',144,324),('xxxhdpi',192,432)]:
    folder = res / f'mipmap-{density}'
    for name in ['ic_launcher.png', 'ic_launcher_round.png']:
        icon.resize((size,size), Image.Resampling.NEAREST).save(folder/name)
    icon.resize((fg_size,fg_size), Image.Resampling.NEAREST).save(folder/'ic_launcher_foreground.png')
(res/'values/ic_launcher_background.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#4a2511</color></resources>\n', encoding='utf-8')
for path in res.glob('drawable*/splash.png'):
    with Image.open(path) as old:
        width,height = old.size
    splash = Image.new('RGB',(width,height),'#4a2511')
    size = min(width,height)//3
    badge = icon.resize((size,size),Image.Resampling.NEAREST)
    splash.paste(badge,((width-size)//2,(height-size)//2),badge)
    splash.save(path)
print('Android launcher icons updated from v3 PNG')
