"""Exporta ícones técnicos usando o retrato existente, sem recriar a personagem."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
target = root / 'assets' / 'android'
target.mkdir(parents=True, exist_ok=True)
portrait = Image.open(root / 'assets' / 'lara-prime-lar.webp').convert('RGB')
# Mesmo enquadramento de rosto utilizado pela interface atual.
face = portrait.crop((422, 240, 1122, 940))
for size, filename, factor in [(192, 'lara-192.png', .86), (512, 'lara-512.png', .86), (512, 'lara-maskable-512.png', .70)]:
    side = round(size * factor)
    offset = (size - side) // 2
    image = Image.new('RGB', (size, size), '#062850')
    mask = Image.new('L', (side, side), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, side - 1, side - 1), fill=255)
    image.paste(face.resize((side, side), Image.Resampling.LANCZOS), (offset, offset), mask)
    ImageDraw.Draw(image).ellipse((offset, offset, offset + side - 1, offset + side - 1), outline='#ebc47a', width=max(2, round(size * .008)))
    image.save(target / filename, optimize=True)
print('Ícones Android 192, 512 e maskable 512 exportados.')
