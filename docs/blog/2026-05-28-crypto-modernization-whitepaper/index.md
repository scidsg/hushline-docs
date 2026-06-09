---
slug: crypto-modernization-whitepaper
title: "Hush Line Crypto Modernization: A Whitepaper for Safer Disclosure Infrastructure"
subtitle: How Hush Line modernized encrypted data handling without weakening usability, anonymity, or migration safety.
tags: [hushline, whistleblowing]
---

Hush Line exists for moments when a person needs to disclose sensitive information without being exposed by the tool that was supposed to protect them. That changes how crypto modernization has to be designed and described. The goal is not to chase new primitives for their own sake. The goal is to preserve the whistleblower's path to a trusted recipient while reducing the harm caused by database exposure, key-management mistakes, migration failure, or unclear security claims.

This whitepaper updates the May 28, 2026 crypto modernization paper. The original version correctly separated shipped work from planned work at that time, but it is now out of date. The current implementation completes the encrypted-field modernization scope: Hush Line has a production-capable AES-256-GCM encrypted-field envelope for new writes, a code-owned AAD contract, dual-read compatibility, schema readiness checks, migration tooling, rehearsal evidence, release gates, and test coverage.

<!-- truncate -->

## Executive Summary

Hush Line now has the crypto modernization architecture needed for the current encrypted-field scope.

The completed work includes:

- recipient PGP setup and intake blocking when recipient key material is missing
- client-side OpenPGP encryption for supported browser submission paths
- server-side encrypted database fields for selected sensitive values
- versioned `hlfield:` envelopes for encrypted-field format agility
- an explicit AES-256-GCM encrypted-field writer for new values
- canonical authenticated associated data (AAD) for AES-GCM encrypted fields
- dual readers for legacy Fernet, versioned Fernet envelopes, and AES-GCM envelopes
- schema readiness checks that fail closed before envelope writes can be enabled
- migration and preflight tooling with dry-run, live-batch, resume, rollback, and release-gate controls
- known-answer vectors, negative tests, inventory tests, migration tests, and documentation tests

The important distinction is deployment state, not implementation maturity. Legacy Fernet remains the default write format unless an operator deliberately enables the AES-GCM writer for a deployment. Legacy Fernet read support remains available by design so existing ciphertext can be read during rollout and rollback windows. That is not unfinished modernization. It is the safety mechanism that prevents an encryption upgrade from becoming a data-loss incident.

## What "Complete" Means

For this paper, "complete" means the encrypted-field modernization design is implemented and testable in the application repository. It does not mean every deployment has already changed its default write format or that every historical ciphertext row in every environment has already been rewritten.

| Question | Current answer |
| --- | --- |
| Is the AES-256-GCM encrypted-field writer implemented? | Yes. It is available through `ENCRYPTED_FIELD_WRITE_FORMAT=envelope-aes-gcm`. |
| Can AES-GCM writes be enabled accidentally? | No. They require both `ENCRYPTED_FIELD_AES_GCM_WRITES_ENABLED=true` and a non-empty `ENCRYPTED_FIELD_AES_GCM_WRITE_APPROVAL` value. |
| Are AES-GCM encrypted fields bound to field context? | Yes. The AAD includes the algorithm, envelope version, AAD schema, stable domain, table, column, and immutable row identifiers. |
| Are old values still readable? | Yes. Legacy Fernet and versioned Fernet envelopes remain readable during rollout. |
| Can unsupported schemas silently truncate envelope ciphertext? | No. Envelope writes fail closed unless the widened encrypted-field schema is present. |
| Is migration safety implemented? | Yes. The helper supports preflight, dry run, bounded live batches, resume, verification, rollback controls, and a release-gate manifest. |
| Is legacy-read retirement complete? | Not yet, by design. Read retirement is a later operational step after migration evidence and rollback closure. |

## Why Crypto Modernization Matters for Whistleblowing Systems

Whistleblowing systems do not only process "data." They process information that can affect employment, immigration status, litigation, physical safety, retaliation risk, and public-interest investigations. ISO 37002 frames whistleblowing systems around trust, impartiality, and protection; Hush Line translates that into product priorities such as anonymity of the whistleblower, confidentiality and integrity of disclosures, authenticity of the receiver, plausible deniability, availability, and usability.

For Hush Line, cryptography has to support those priorities without making the product unusable. A system that offers strong theoretical confidentiality but fails during setup can push recipients to publish an intake page before encryption is ready. A system that rewrites stored ciphertext without rollback proof can turn protected records into unrecoverable records. A system that silently changes key behavior during startup can make disaster recovery depend on side effects operators did not approve.

Modernization therefore has two jobs:

1. Improve cryptographic and operational properties where Hush Line identified a real gap.
2. Keep the existing disclosure flow available, understandable, and recoverable while the system changes.

That second job is not optional. For Hush Line, migration safety is a security property.

## Current Security And Privacy Goals

Hush Line's product surface supports unauthenticated senders, authenticated recipients, paid recipient features such as aliases and custom fields, and administrator controls for managed deployments. Crypto modernization respects those flows.

The most relevant current behavior is:

- Senders can submit messages from public recipient pages without creating an account.
- Recipients configure PGP keys manually or through Proton key lookup.
- Public message intake is blocked when the recipient lacks usable PGP key material.
- Email notifications can be generic, include message content, or encrypt the full email body for PGP-capable recipients.
- Multi-recipient notification paths can use per-recipient PGP keys.
- Selected database fields are encrypted server-side with application-managed key material.
- Custom field values use the same encrypted-field wrapper; when a custom field is marked encrypted, the stored value may also contain recipient PGP ciphertext.

This gives Hush Line a layered model. Recipient PGP protects disclosure content for recipient workflows. Server-side encrypted fields reduce harm if a database, backup, or export leaks without the corresponding application secret. Operational controls protect the migration path so that a security change does not create silent data loss.

## What Is Implemented

| Area | Implemented state |
| --- | --- |
| Recipient-key setup | Recipients can add a PGP key manually or import a Proton public key during onboarding or settings. |
| Intake guard | Public intake is blocked when the recipient lacks usable PGP key material. |
| Notification modes | Hush Line supports generic notification only, message-content notification, and full-body encrypted notification behavior. |
| Multi-recipient notifications | Enabled notification recipients can have separate email addresses and PGP keys. |
| Server-side encrypted fields | Selected fields are encrypted through `hushline.crypto.encrypt_field()` and read through `decrypt_field()`. |
| Fernet timestamp mitigation | Hush Line pins Fernet token time to zero for encrypted-field writes to avoid storing per-write activity timestamps in those ciphertexts. |
| Versioned envelopes | Hush Line serializes encrypted-field envelopes with the `hlfield:` prefix so stored values carry an explicit format. |
| AES-GCM production writer | `envelope-aes-gcm` writes AES-256-GCM envelopes for new values when the schema, configuration, AAD contract, and maintainer approval gates pass. |
| Domain-bound AAD | AES-GCM writes authenticate stable field domains and immutable row identifiers so wrong-field or wrong-row use fails closed. |
| Dual-read compatibility | Readers support legacy Fernet values, versioned Fernet envelopes, and AES-GCM envelopes during migration and rollback windows. |
| Migration tooling | The encrypted-field CLI supports preflight, dry run, live batches, resume tokens, per-row verification, rollback controls, and production release gates. |
| Evidence and tests | The repository includes AEAD evaluation, modernization ADR, migration runbook, restored-backup rehearsal report, known-answer vectors, and automated tests. |

## Threat Model

### In Scope

Encrypted-field modernization is designed for database-only exposure:

- leaked Postgres tables, snapshots, backups, exports, or support bundles
- read-only database credentials without application secret access
- accidental raw database disclosure without `ENCRYPTION_KEY`
- database row or column tampering that AAD-aware ciphertext can detect
- ciphertext copied between fields, rows, or deployments where domain binding should fail closed

This is a defense-in-depth layer. It is valuable because database backups and exports are operationally common, long-lived, and easy to mishandle.

### Out Of Scope

Encrypted database fields do not protect plaintext when the attacker can use Hush Line as the application can:

- remote code execution or malicious dependency execution
- theft of `ENCRYPTION_KEY`, process memory, container environment variables, or deploy secrets
- compromised CI/CD, build artifacts, or deployment paths
- malicious JavaScript that defeats client-side encryption before submission
- authenticated recipient account compromise
- endpoint compromise on the sender or recipient device
- coercion, subpoena, traffic analysis, or other operational-security threats outside database-field encryption

This boundary matters. A stronger encrypted-field format reduces harm from database exposure. It does not make a fully compromised application server safe.

## Protected Data Paths

The encrypted-field modernization inventory covers:

- TOTP shared secrets for two-factor authentication
- legacy or synchronized notification email addresses
- custom SMTP hostnames, usernames, and passwords
- recipient public PGP key material
- notification-recipient email addresses and public PGP keys
- custom message-field values

Some intentionally visible or separately protected values are out of scope:

- password hashes, which are verifiers rather than encrypted secrets
- usernames, directory visibility, public profile metadata, and trust badges
- message status, timestamps, reply slugs, and relational metadata
- billing identifiers and subscription metadata
- SMTP port, SMTP encryption mode, and SMTP sender metadata
- field labels, field types, choices, and sort order

The point is not to encrypt every column. The point is to have a code-owned inventory that states what is protected, what is not, and why.

## Modernization Principles

### 1. Preserve Existing Ciphertext Readability

Hush Line deploys dual readers before changing write formats. The application reads legacy Fernet, `envelope-fernet`, and `envelope-aes-gcm` values. This avoids a common failure mode: shipping a new format that works for new rows while breaking old rows or making rollback unsafe.

### 2. Version The Envelope, Not Just The Algorithm

Algorithm agility requires more than changing a function call. A durable envelope needs to say which format it uses, how to parse it, where the nonce lives, and what context must be authenticated.

Hush Line's encrypted-field envelope prefix is `hlfield:`. The transitional `envelope-fernet` format wraps a Fernet token. The AES-GCM format stores an algorithm identifier, version, nonce, and ciphertext in an ASCII-safe envelope.

### 3. Bind Ciphertext To Stable Domains

AES-GCM writes authenticate stable context:

- algorithm
- envelope version
- AAD schema
- stable domain string
- table and column
- immutable row identifiers

The AAD contract avoids mutable values such as usernames, email addresses, display names, profile text, field labels, message text, SMTP settings, or PGP key text. If mutable values were authenticated, normal profile or settings edits could make historical ciphertext undecryptable unless Hush Line retained every prior value.

### 4. Separate Concerns

Encrypted-field modernization is not password hashing modernization. It is not browser session-key rotation. It is not operational key-service design. Hush Line separates:

- `ENCRYPTION_KEY` for server-side encrypted database fields
- `SESSION_FERNET_KEY` for encrypted browser session cookies
- Flask `SECRET_KEY` for application secret needs such as HMAC helpers
- password hashes as authentication verifiers
- recipient PGP keys as disclosure-delivery keys

Keeping these separate avoids broad, risky migrations and makes recovery behavior easier to explain.

### 5. Treat Migration Evidence As A Release Gate

A cryptographic migration should not be accepted because the code compiles. Hush Line's migration path requires preflight checks, dry runs, small live batches, idempotent resume, per-row verification, backup-and-restore rehearsal, progress reporting, rollback rehearsal, and release-gate artifacts that avoid plaintext and full ciphertext.

The migration helper must not log plaintext disclosures, secrets, private keys, tokens, TOTP secrets, email passwords, raw encrypted-field secrets, or full ciphertext values.

## Production Cryptographic Design

### Legacy Fernet Remains A Compatibility Format

Fernet remains readable and remains the default write format unless a deployment explicitly changes `ENCRYPTED_FIELD_WRITE_FORMAT`. Hush Line pins Fernet timestamps to zero for encrypted-field writes to avoid storing per-write activity timing inside ciphertext.

The limitation is that Fernet does not provide native AAD. A versioned Fernet envelope supports compatibility and rollout checks, but it does not make a Fernet token fail closed if copied into the wrong field or row.

### AES-256-GCM Is The Production AEAD Writer

AES-GCM is the implemented AEAD writer for new encrypted-field values. It is enabled only when all of these are true:

- `ENCRYPTED_FIELD_WRITE_FORMAT=envelope-aes-gcm`
- `ENCRYPTED_FIELD_AES_GCM_WRITES_ENABLED=true`
- `ENCRYPTED_FIELD_AES_GCM_WRITE_APPROVAL` contains a maintainer approval reference
- the encrypted-field envelope schema readiness check passes
- the write supplies the code-owned encrypted-field contract and required AAD values

The AES-GCM writer uses the existing Python `cryptography` dependency, derives a dedicated AES-GCM key from the configured encrypted-field key material, generates a random 96-bit nonce for each write, stores the nonce in the envelope, and authenticates the Hush Line AAD contract. Decryption fails closed for wrong key material, wrong AAD, wrong field domain, malformed nonce, malformed ciphertext, unknown version, or unknown algorithm.

### Key Rotation Remains A Separate Design

The current modernization does not hide key rotation inside the encrypted-field format change. Hush Line supports fallback key material for reads, but key identifiers, external key services, sealed local secret tooling, and multi-key operational policy remain separate key-management work. That separation is intentional: rotating operational secrets has different failure modes than changing ciphertext format.

### HPKE And Post-Quantum Recipient Encryption Remain Future Recipient-Protocol Work

Hybrid Public Key Encryption (HPKE) and post-quantum cryptography are relevant to future recipient-encryption discussions, but they are not replacements for Hush Line's deployed recipient PGP path today. A move toward HPKE or post-quantum recipient encryption would need recipient key lifecycle design, browser support decisions, key discovery, migration strategy, interoperability expectations, user-facing recovery behavior, and security review.

The near-term posture is crypto-agility: versioned envelopes, explicit algorithms, source-backed claims, no hidden key generation, and a design path that can evaluate future recipient-encryption protocols when the ecosystem is ready enough for Hush Line's user base.

## Migration And Rollout Model

Hush Line's encrypted-field rollout strategy is implemented as a phased model:

1. **Inventory and threat model.** Keep a code-owned list of protected fields and a clear database-only threat model.
2. **Dual reader.** Deploy code that reads legacy and target formats before any production write-format change.
3. **Schema readiness.** Widen columns where required so new envelopes cannot be truncated.
4. **Preflight.** Count legacy, target, empty, malformed, and undecryptable values without logging sensitive material.
5. **Dry run.** Exercise the same selection, decryption, candidate rewrite, and verification path without writing.
6. **Rehearsal.** Run staging or restored-backup migration, including interruption, resume, rollback, and app-flow verification.
7. **Release gate.** Review artifacts that prove readiness without exposing plaintext or full ciphertext.
8. **Small batches.** Run production live migration in bounded batches while normal reads and writes continue.
9. **Rollback window.** Keep legacy readers deployed until migration completion and rollback closure are explicitly approved.
10. **Retirement.** Remove old read formats only in a later issue after evidence proves they are no longer needed.

This rollout model is conservative because unreadable encrypted data is a user-impacting security incident.

## Evidence Checklist

| Control | Evidence in the Hush Line app repo |
| --- | --- |
| AES-GCM writer and parser | `hushline/crypto.py` implements AES-GCM envelope serialization, parsing, encryption, and decryption. |
| Explicit enablement gates | `hushline/config.py` defines `ENCRYPTED_FIELD_WRITE_FORMAT`, `ENCRYPTED_FIELD_AES_GCM_WRITES_ENABLED`, and `ENCRYPTED_FIELD_AES_GCM_WRITE_APPROVAL`. |
| AAD contract | `hushline.crypto.ENCRYPTED_FIELD_CONTRACTS` defines stable domains, tables, columns, and row identifiers. |
| Schema fail-closed behavior | `assert_encrypted_field_envelope_schema_ready()` blocks envelope writes before the widened schema exists. |
| Migration helper | `hushline/cli_encrypted_field.py` implements preflight, migration, resume, rollback-oriented checks, and release-gate validation. |
| Known-answer vectors | `tests/testdata/crypto-known-answer-vectors.json` and `tests/test_crypto.py` cover envelope vectors and negative cases. |
| Inventory coverage | `tests/test_encrypted_field_inventory.py` keeps the protected-field inventory and encrypted properties aligned. |
| Migration safety | `tests/test_cli_commands.py`, `tests/test_migrations.py`, and runbook tests cover preflight, schema readiness, dry-run/live behavior, release gates, rollback, and downgrade refusal. |
| Operational documentation | The ADR, AEAD evaluation, migration runbook, and restored-backup rehearsal report document the intended rollout boundary. |

## Usability And Accessibility Requirements

Hush Line cannot treat cryptography as a recipient-only engineering concern. The sender may be under time pressure, observation, stress, or device constraints. The recipient may be a journalist, lawyer, educator, board member, organizer, or administrator who needs a trustworthy intake path without becoming a cryptography expert.

Modernization preserves:

- no-account submission for senders
- clear recipient authenticity signals
- setup flows that make encryption completion obvious
- browser-first usage without mandatory app installation
- accessible copy and controls
- failure behavior that avoids silently submitting plaintext when client-side encryption is unavailable
- clear status language that does not overpromise confidentiality beyond the actual deployment model

Any future cryptographic upgrade that increases recipient setup burden must include product work that reduces mistakes. Stronger primitives do not help if recipients misconfigure keys or publish unusable intake pages.

## Remaining Work

The core encrypted-field modernization is complete. The remaining items are operational rollout, key-management evolution, and future protocol research:

- enable `envelope-aes-gcm` per deployment only after maintainers approve the release-gate evidence
- migrate existing ciphertext in bounded batches where the operator chooses to rewrite historical rows
- retire legacy Fernet reads only after migration evidence and rollback windows are closed
- design key identifiers, external key-service support, or sealed local secret tooling as separate key-management work
- continue dependency audits and review `cryptography` and OpenSSL security advisories before rollout-sensitive releases
- evaluate HPKE and post-quantum recipient-encryption paths separately from server-side encrypted database fields

These are not gaps in the implemented encrypted-field architecture. They are the remaining lifecycle steps that keep a safety-critical deployment honest and recoverable.

## Conclusion

Best-in-class crypto modernization for Hush Line is not a single algorithm swap. It is the combination of explicit envelopes, domain-bound authenticated fields, dual-read compatibility, guarded enablement, migration tooling, rehearsal evidence, and restrained public claims.

That work is now implemented for the current encrypted-field scope. Hush Line can accurately say it has production-capable AES-256-GCM encrypted fields with AAD, while also being precise that legacy reads remain during rollout and that each deployment must pass its own release gate before changing write format or migrating historical ciphertext.

The modernization goal remains simple to state and hard to execute: stronger cryptography, safer operations, fewer exaggerated claims, and no regression in the human workflow that Hush Line exists to protect.

## References

- [Hush Line AGENTS.md](https://github.com/scidsg/hushline/blob/main/AGENTS.md)
- [Hush Line use cases](https://github.com/scidsg/hushline/blob/main/docs/USE-CASES.md)
- [Encrypted Field Modernization ADR](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-MODERNIZATION-ADR.md)
- [Encrypted Field AEAD Evaluation](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-AEAD-EVALUATION.md)
- [Encrypted Field Migration Runbook](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-MIGRATION-RUNBOOK.md)
- [Encrypted Field Restored-Backup Rehearsal Report](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-RESTORED-BACKUP-REHEARSAL-REPORT.md)
- [Operational Key Management Design](https://github.com/scidsg/hushline/blob/main/docs/OPERATIONAL-KEY-MANAGEMENT-DESIGN.md)
- [RFC 9580: OpenPGP](https://www.rfc-editor.org/rfc/rfc9580.html)
- [RFC 9180: Hybrid Public Key Encryption](https://www.rfc-editor.org/rfc/rfc9180.html)
- [NIST SP 800-38D: Galois/Counter Mode and GMAC](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST post-quantum cryptography project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Signal PQXDH specification](https://signal.org/docs/specifications/pqxdh/)
- [Signal Double Ratchet specification](https://signal.org/docs/specifications/doubleratchet/)
- [W3C Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/)
