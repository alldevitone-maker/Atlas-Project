# F4 · Verified TSE snapshot · 2026 SC · 1º turno

The first official raw-source snapshot for F4 is now pinned by digest.

## Verification

- Source authority: Tribunal Superior Eleitoral (TSE/AGEL)
- Source file: `bweb_1t_SC_051020261403.zip`
- Size: 153,178,332 bytes
- Integrity: verified against the TSE-published SHA-512 resource
- Atlas SHA-256: `af9e03f17cefe6f4a0be48093a920974d61feb9b07d3ea69b1b84fb7c9a7599f`
- SHA-512: `618c1cacf80bc2964d3bb5e6274ba3e2adeed853077083bc01004e5110e79615868cf3c39b490e283c181c716275d4473da35d11f407111f4170fc91a8a93db7`
- GitHub Actions run: https://github.com/alldevitone-maker/Atlas-Project/actions/runs/37714629693
- Artifact ID: `11522563296`

The raw ZIP is deliberately excluded from Git history. The repository stores the immutable provenance descriptor and transformation code; the raw bytes are retained as an Actions artifact.

## F4 status

This closes the **source-integrity** gate for the 2026 SC first-round BU.

F4 is still not fully complete. The next gate is to derive the Jaraguá do Sul result from this verified snapshot and reconcile it against the official municipal totals, then attach the derived dataset to this exact source digest.
