"""One-time fontTools 4.60.1 derivation; generated assets ship with upstream OFL files."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
import hashlib, json, shutil
root = Path(__file__).resolve().parents[1]
source = root / 'apps/web/src/assets/fonts'
native = root / 'apps/mobile/src/assets/fonts'
native.mkdir(parents=True, exist_ok=True)
outputs = {}
for family, weights in [('Newsreader', [500,600]), ('InstrumentSans', [400,500,600,700])]:
    font = TTFont(source / (family + '.ttf'))
    font.recalcTimestamp = False
    font.flavor = 'woff2'
    output = source / (family + '.woff2')
    font.save(output)
    outputs[str(output.relative_to(root))] = hashlib.sha256(output.read_bytes()).hexdigest()
    for weight in weights:
        original = TTFont(source / (family + '.ttf'))
        axes = {'wght':weight}
        for axis in original['fvar'].axes:
            if axis.axisTag != 'wght': axes[axis.axisTag] = 16 if axis.axisTag == 'opsz' else axis.defaultValue
        font = instantiateVariableFont(original, axes, inplace=True)
        font.recalcTimestamp = False
        name = family + str(weight)
        for record in font['name'].names:
            if record.nameID in (1,2,4,6,16,17):
                value = 'Regular' if record.nameID in (2,17) else name
                record.string = value.encode(record.getEncoding())
        output = native / (name + '.ttf')
        font.save(output)
        outputs[str(output.relative_to(root))] = hashlib.sha256(output.read_bytes()).hexdigest()
    shutil.copyfile(source / (family+'-OFL.txt'), native / (family+'-OFL.txt'))
(root/'docs/research/accounts-journey-access/derived_fonts_2026-11-04.json').write_text(json.dumps({'tool':'fontTools 4.60.1', 'outputs':outputs}, indent=2)+'\n')
