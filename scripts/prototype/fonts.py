"""Reproduce pinned assets with isolated fonttools==4.61.1 and brotli==1.2.0."""
import hashlib
import io
import json
import pathlib
import urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = pathlib.Path(__file__).resolve().parents[2]
target = root / "tests/fixtures/prototype"
sources = json.loads((root / "docs/research/accounts-journey-access/font_sources_2026-11-03.json").read_text())
records = []
for source in sources["families"]:
    font_bytes = urllib.request.urlopen(source["font"]["url"]).read()
    assert hashlib.sha256(font_bytes).hexdigest() == source["font"]["sha256"]
    license_bytes = urllib.request.urlopen(source["license"]["url"]).read()
    assert hashlib.sha256(license_bytes).hexdigest() == source["license"]["sha256"]
    prefix = "newsreader" if source["family"] == "Newsreader" else "instrument"
    (target / f"{prefix}-OFL.txt").write_bytes(license_bytes)
    for weight in source["selectedAxes"]["wght"]:
        axes = {key: value for key, value in source["selectedAxes"].items() if key != "wght"}
        axes["wght"] = weight
        font = instantiateVariableFont(TTFont(io.BytesIO(font_bytes)), axes, inplace=True, updateFontNames=True)
        for extension in ["ttf", "woff2"]:
            name = f"{prefix}-{weight}.{extension}"
            font.flavor = None if extension == "ttf" else "woff2"
            font.save(target / name)
            records.append({"file": name, "sha256": hashlib.sha256((target / name).read_bytes()).hexdigest(), "axes": axes, "sourceSha256": source["font"]["sha256"]})
(target / "derived-fonts.json").write_text(json.dumps({"tool": "fonttools 4.61.1; brotli 1.2.0", "files": records}, indent=2) + "\n")
