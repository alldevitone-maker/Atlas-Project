#!/usr/bin/env python3
"""Download an official source snapshot and verify its published SHA-512 digest.

The raw source is intentionally not committed to Git. The script emits an
immutable snapshot manifest with SHA-512 and SHA-256 digests so the pipeline can
prove which source bytes produced a derived dataset.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


HEX512 = re.compile(r"(?i)\b[0-9a-f]{128}\b")


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Projeto-Atlas/0.2 source-snapshot"},
    )
    with urllib.request.urlopen(request, timeout=180) as response, destination.open("wb") as out:
        shutil.copyfileobj(response, out)


def digest(path: Path, algorithm: str) -> str:
    h = hashlib.new(algorithm)
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def published_sha512(path: Path) -> str:
    text = path.read_bytes().decode("utf-8", errors="replace")
    match = HEX512.search(text)
    if not match:
        raise RuntimeError("Published SHA-512 resource does not contain a 128-character hexadecimal digest.")
    return match.group(0).lower()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("raw-snapshot"))
    args = parser.parse_args()

    source = json.loads(args.manifest.read_text(encoding="utf-8"))
    resources = source.get("resources")
    if not isinstance(resources, dict):
        raise SystemExit("Manifest must contain a resources object with dataUrl and hashUrl.")

    data_url = resources["dataUrl"]
    hash_url = resources["hashUrl"]

    args.out_dir.mkdir(parents=True, exist_ok=True)
    data_name = Path(urlparse(data_url).path).name or "source.zip"
    data_path = args.out_dir / data_name
    hash_path = args.out_dir / (data_name + ".sha512")

    download(data_url, data_path)
    download(hash_url, hash_path)

    expected = published_sha512(hash_path)
    actual512 = digest(data_path, "sha512")
    if actual512 != expected:
        raise SystemExit(f"SHA-512 mismatch: expected {expected}, got {actual512}")

    snapshot = {
        "schemaVersion": "verified-source-snapshot-v1",
        "sourceManifest": str(args.manifest),
        "sourceId": source.get("id"),
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "dataUrl": data_url,
        "hashUrl": hash_url,
        "fileName": data_name,
        "sizeBytes": data_path.stat().st_size,
        "sha512": actual512,
        "sha256": digest(data_path, "sha256"),
        "integrity": "verified",
    }
    (args.out_dir / "snapshot-manifest.json").write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(snapshot, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
