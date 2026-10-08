# Raw source snapshot policy

## Purpose

Primary public sources must be reproducible without turning Git history into a binary archive.

## Rule

Raw TSE ZIP files are **not committed to Git**.

For each source revision, the project stores a versioned source manifest containing:

- authority;
- dataset page;
- exact resource URL;
- published integrity resource when available;
- territorial/election scope;
- license;
- retention strategy.

A manual GitHub Actions workflow downloads the source, verifies the published SHA-512 digest, computes SHA-256 for Atlas provenance and stores the bytes as a workflow artifact.

Derived datasets must record the verified snapshot digest that produced them.

## Completion gate

F3/F4 cannot be marked complete merely because a normalized JSON exists. The corresponding source snapshot must have:

1. an exact source manifest;
2. a successful integrity verification;
3. an immutable digest in provenance;
4. a reproducible transformation command.

The 2022 manifest currently records the source URLs preserved by the legacy baseline, but its official hash capture is still pending. Therefore F3 remains in progress.
