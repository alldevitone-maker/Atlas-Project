#!/usr/bin/env python3
"""Capture an official source snapshot with immutable digests.

When the authority publishes a SHA-512 sidecar, the script verifies it.
When no published digest exists, the source is still captured reproducibly,
but the manifest records that distinction instead of claiming verification.
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
        headers={"User-Agent": "Projeto-Atlas/0.3 source-snapshot"},
    )
    with urllib.request.urlopen(request, timeout=300) as response, destination.open("wb") as out:
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
        raise RuntimeError(
            "Published SHA-512 resource does not contain a 128-character hexadecimal digest."
        )
    return match.group(0).lower()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("raw-snapshot"))
    args = parser.parse_args()

    source = json.loads(args.manifest.read_text(encoding="utf-8"))
    resources = source.get("resources")
    if not isinstance(resources, dict) or not resources.get("dataUrl"):
        raise SystemExit("Manifest must contain resources.dataUrl.")

    data_url = resources["dataUrl"]
    hash_url = resources.get("hashUrl")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    data_name = Path(urlparse(data_url).path).name or "source.zip"
    data_path = args.out_dir / data_name

    download(data_url, data_path)
    actual512 = digest(data_path, "sha512")
    actual256 = digest(data_path, "sha256")

    integrity = "captured-no-published-digest"
    published_digest_verified = False
    expected512 = None

    if hash_url:
        hash_path = args.out_dir / (data_name + ".sha512")
        download(hash_url, hash_path)
        expected512 = published_sha512(hash_path)
        if actual512 != expected512:
            raise SystemExit(f"SHA-512 mismatch: expected {expected512}, got {actual512}")
        integrity = "verified-published-sha512"
        published_digest_verified = True

    snapshot = {
        "schemaVersion": "source-snapshot-v2",
        "sourceManifest": str(args.manifest),
        "sourceId": source.get("id"),
        "authority": source.get("authority"),
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "dataUrl": data_url,
        "hashUrl": hash_url,
        "fileName": data_name,
        "sizeBytes": data_path.stat().st_size,
        "sha512": actual512,
        "sha256": actual256,
        "publishedSha512": expected512,
        "publishedDigestVerified": published_digest_verified,
        "integrity": integrity,
    }
    (args.out_dir / "snapshot-manifest.json").write_text(
        json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(snapshot, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
