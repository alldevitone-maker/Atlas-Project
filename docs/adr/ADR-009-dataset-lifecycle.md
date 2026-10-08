# Dataset lifecycle

**Status:** accepted for foundation

## Decision

Every ingestion creates an immutable revision with checksum and optional supersedes link.

## Consequences

Must be enforced through contracts, tests, CI or package boundaries where applicable.
