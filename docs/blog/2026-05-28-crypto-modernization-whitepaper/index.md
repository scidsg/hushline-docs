---
slug: crypto-modernization-whitepaper
title: "Hush Line Crypto Modernization: A Whitepaper for Safer Disclosure Infrastructure"
subtitle: How Hush Line is modernizing encrypted data handling without weakening usability, anonymity, or migration safety.
tags: [hushline, whistleblowing]
---

Hush Line exists for moments when a person needs to disclose sensitive information without being exposed by the tool that was supposed to protect them. That changes how crypto modernization has to be planned. The goal is not to chase new primitives for their own sake. The goal is to preserve the whistleblower's path to a trusted recipient while reducing the harm caused by database exposure, key-management mistakes, migration failure, or unclear security claims.

This whitepaper describes Hush Line's crypto modernization work as of May 28, 2026. It distinguishes what is already shipped from what is planned, what is deliberately deferred, and what must be true before Hush Line can call an existing-ciphertext migration "best-in-class" in the domain-bound encryption sense.

<!-- truncate -->

## Executive Summary

Hush Line currently combines several layers of protection:

- public tip pages that can receive messages without requiring the sender to create an account
- recipient PGP keys for message and notification-content encryption paths
- server-side encrypted database fields for selected sensitive values
- encrypted browser session cookies
- setup flows that block message intake until recipients have usable PGP key material
- operational guardrails that require compatibility, rollback, and recovery planning before encryption-format changes

The modernization work described here focuses on selected server-side encrypted database fields. It does not replace Hush Line's recipient PGP workflow, change password hashing, change browser session secrets, alter TLS, or claim to solve endpoint compromise. Its primary security objective is defense in depth against database-only or backup-only exposure: an attacker can inspect database contents, but cannot read the application secret material or execute application code.

The current production encrypted-field write path remains legacy Fernet unless operators explicitly configure the transitional `envelope-fernet` format after the required readiness gates. Hush Line has also prototyped an AES-256-GCM encrypted-field envelope with authenticated associated data (AAD), but that prototype is not a production write path.

The core modernization direction is:

- preserve readability of existing ciphertext before changing write formats
- use versioned envelopes so algorithms and formats can be migrated intentionally
- bind future AEAD ciphertext to stable field domains and immutable row identifiers
- keep password hashing, session encryption, and operational key management separate from encrypted-field work
- require staging or restored-backup rehearsal before production migration
- avoid claims that exceed deployed behavior

## Why Crypto Modernization Matters for Whistleblowing Systems

Whistleblowing systems do not only process "data." They process information that can affect employment, immigration status, litigation, physical safety, retaliation risk, and public-interest investigations. ISO 37002 frames whistleblowing systems around trust, impartiality, and protection; Hush Line translates that into product priorities such as anonymity of the whistleblower, confidentiality and integrity of disclosures, authenticity of the receiver, plausible deniability, availability, and usability.

For Hush Line, cryptography has to support those priorities without making the product unusable. A system that offers strong theoretical confidentiality but fails during setup can push recipients to publish an intake page before encryption is ready. A system that rewrites stored ciphertext without rollback proof can turn protected records into unrecoverable records. A system that silently changes key behavior during startup can make disaster recovery depend on side effects operators did not approve.

Modernization therefore has two jobs:

1. Improve cryptographic and operational properties where Hush Line has identified a real gap.
2. Keep the existing disclosure flow available, understandable, and recoverable while the system changes.

That second job is not optional. For Hush Line, migration safety is a security property.

## Current Security and Privacy Goals

Hush Line's current product surface supports unauthenticated senders, authenticated recipients, paid recipient features such as aliases and custom fields, and administrator controls for managed deployments. Crypto modernization has to respect all of those flows.

The most relevant current behavior is:

- Senders can submit messages from public recipient pages without creating an account.
- Recipients configure PGP keys manually or through Proton key lookup.
- Public message intake is blocked when the recipient does not have usable recipient PGP key material.
- Email notifications can be generic, include message content, or encrypt the full email body for PGP-capable recipients.
- Multi-recipient notification paths can use per-recipient PGP keys.
- Selected database fields are encrypted server-side with application-managed key material.
- Custom field values use the same encrypted-field wrapper; when a custom field is marked encrypted, the stored value may also contain recipient PGP ciphertext.

This gives Hush Line a layered model. Recipient PGP protects disclosure content for recipient workflows. Server-side encrypted fields reduce harm if a database, backup, or export leaks without the corresponding application secret. Operational controls protect the migration path so that a security change does not create silent data loss.

## What Is Already Shipped

The following items are already present in the main Hush Line application work:

| Area | Current state |
| --- | --- |
| Recipient-key setup | Recipients can add a PGP key manually or import a Proton public key during onboarding or settings. |
| Intake guard | Public intake is blocked when the recipient lacks usable PGP key material. |
| Notification modes | Hush Line supports generic notification only, message-content notification, and full-body encrypted notification behavior. |
| Multi-recipient notifications | Enabled notification recipients can have separate email addresses and PGP keys. |
| Server-side encrypted fields | Selected fields are encrypted through `hushline.crypto.encrypt_field()` and read through `decrypt_field()`. |
| Fernet timestamp mitigation | Hush Line pins Fernet token time to zero for encrypted-field writes to avoid storing per-write activity timestamps in those ciphertexts. |
| Versioned envelope compatibility | Hush Line can read legacy Fernet values and a transitional `hlfield:` Fernet envelope format. |
| AES-GCM prototype | Hush Line has prototype helpers for AES-256-GCM envelopes with AAD, wrong-domain failure behavior, and negative tests. |
| Migration planning | Hush Line has an encrypted-field modernization ADR, AEAD evaluation, migration runbook, rehearsal template, and deployment-readiness document in the main app repo. |

These shipped pieces are meaningful, but they are not the same as a completed production AEAD migration. The current `envelope-fernet` format is a compatibility and rollout format. It adds explicit versioning around existing Fernet ciphertext. It does not cryptographically bind ciphertext to a table, column, stable domain, or immutable row identifier.

## What Is Planned, Not Yet Shipped

The following work remains planned or blocked pending maintainer approval:

- promoting the AES-256-GCM prototype to a production encrypted-field writer
- adding official AES-GCM known-answer vectors and Hush Line-specific envelope vectors
- enabling production writes that cryptographically bind ciphertext to stable domains and canonical AAD
- rehearsing live encrypted-field migration against staging or restored-backup data
- enabling a production migration of existing encrypted-field values
- retiring legacy Fernet reads after migration completion and rollback windows are closed
- adding multi-key production readers or key identifiers for graceful `ENCRYPTION_KEY` rotation
- introducing external key-service support or sealed local secret tooling

Hush Line should not claim production AAD guarantees, domain-bound encrypted-field completion, or "best-in-class" existing-ciphertext migration completion until the production AEAD writer, migration rehearsal, release gates, and maintainer approval are complete.

## Threat Model

### In Scope

Encrypted-field modernization is designed for database-only exposure:

- leaked Postgres tables, snapshots, backups, exports, or support bundles
- read-only database credentials without application secret access
- accidental raw database disclosure without `ENCRYPTION_KEY`
- database row or column tampering that future AAD-aware ciphertext can detect
- ciphertext copied between fields, rows, or deployments where future domain binding can make misuse fail closed

This is a defense-in-depth layer. It is valuable because database backups and exports are operationally common, long-lived, and easy to mishandle.

### Out Of Scope

Encrypted database fields do not protect plaintext when the attacker can use Hush Line as the application can:

- remote code execution or malicious dependency execution
- theft of `ENCRYPTION_KEY`, future encrypted-field keys, process memory, container environment variables, or deploy secrets
- compromised CI/CD, build artifacts, or deployment paths
- malicious JavaScript that defeats client-side encryption before submission
- authenticated recipient account compromise
- endpoint compromise on the sender or recipient device
- coercion, subpoena, traffic analysis, or other operational-security threats outside database-field encryption

This boundary matters. A stronger encrypted-field format reduces harm from database exposure. It does not make a fully compromised application server safe.

## Protected Data Paths

The encrypted-field modernization inventory currently covers:

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

Any production encryption-format change has to read old values before it writes new ones. Hush Line's dual-read approach supports legacy Fernet and transitional envelopes together so operators can deploy readers before changing writers.

This avoids a common failure mode: shipping a new format that works for new rows while breaking old rows or making rollback unsafe.

### 2. Version the Envelope, Not Just the Algorithm

Algorithm agility requires more than changing a function call. A durable envelope needs to say which format it uses, how to parse it, where the nonce or encapsulated key lives, and what context must be authenticated.

Hush Line's current envelope prefix is `hlfield:`. The transitional `envelope-fernet` format wraps a Fernet token. The prototype AEAD format stores an algorithm identifier, version, nonce, and ciphertext in an ASCII-safe envelope.

### 3. Bind Ciphertext to Stable Domains

Future AEAD writes should authenticate stable context:

- algorithm
- envelope version
- AAD schema
- stable domain string
- table and column
- immutable row identifiers

The AAD contract must avoid mutable values such as usernames, email addresses, display names, profile text, field labels, message text, SMTP settings, or PGP key text. If mutable values were authenticated, normal profile or settings edits could make historical ciphertext undecryptable unless Hush Line retained every prior value.

### 4. Separate Concerns

Encrypted-field modernization is not password hashing modernization. It is not browser session-key rotation. It is not operational key-service design. Hush Line explicitly separates:

- `ENCRYPTION_KEY` for server-side encrypted database fields
- `SESSION_FERNET_KEY` for encrypted browser session cookies
- Flask `SECRET_KEY` for application secret needs such as HMAC helpers
- password hashes as authentication verifiers
- recipient PGP keys as disclosure-delivery keys

Keeping these separate avoids broad, risky migrations and makes recovery behavior easier to explain.

### 5. Treat Migration Evidence as a Release Gate

A cryptographic migration should not be accepted because the code compiles. Hush Line's migration plan requires preflight checks, dry runs, small live batches, idempotent resume, per-row verification, backup-and-restore rehearsal, progress reporting, rollback rehearsal, and release-gate artifacts that avoid plaintext and full ciphertext.

The migration helper must not log plaintext disclosures, secrets, private keys, tokens, TOTP secrets, email passwords, raw encrypted-field secrets, or full ciphertext values.

## Candidate Cryptographic Direction

### Current Fernet Continuation

Fernet remains the lowest immediate-risk production write path because it is already deployed, text-friendly, and readable by existing application properties. Hush Line also pins Fernet timestamps to zero for encrypted-field writes to avoid storing per-write activity timing inside ciphertext.

The limitation is that Fernet does not provide native AAD. A transitional outer envelope can support versioning and rollout checks, but it cannot make a Fernet token fail closed if copied into the wrong field or row unless that context is separately authenticated.

### AES-256-GCM as the Preferred Future AEAD Candidate

The Hush Line AEAD evaluation identifies AES-GCM as the preferred future AEAD candidate if maintainers approve a production encrypted-field algorithm change. AES-GCM is broadly deployed, available through the existing Python `cryptography` dependency, and fits Hush Line's desired AAD envelope model.

AES-GCM also has a severe misuse boundary: a nonce must be unique for every encryption under the same key. Hush Line's prototype uses 96-bit random nonces, which align with standard GCM practice for expected encrypted-field write volume, but a production rollout still needs explicit test vectors, write-count monitoring, and fail-closed parsing.

### ChaCha20-Poly1305 as a Deferred Alternative

ChaCha20-Poly1305 is a sound AEAD for many systems, especially where software performance and non-FIPS deployments are the priority. Hush Line has not identified a Hush Line-specific reason to choose it before AES-GCM for encrypted database fields. It remains a reasonable future option if deployment constraints change.

### HPKE and Future Recipient Encryption

Hybrid Public Key Encryption (HPKE) is an IETF standard for encrypting arbitrary plaintexts to a recipient public key using a KEM, KDF, and AEAD. It is relevant to future design discussions because Hush Line's product problem includes public-key encryption to recipients, multi-recipient delivery, and possible future protocol agility beyond classic OpenPGP workflows.

HPKE is not currently a replacement for Hush Line's deployed recipient PGP path. A move toward HPKE would need recipient key lifecycle design, browser support decisions, key discovery, migration strategy, interoperability expectations, user-facing recovery behavior, and security review.

### Post-Quantum Readiness

NIST finalized its first post-quantum cryptography standards in August 2024, including ML-KEM for key establishment and ML-DSA and SLH-DSA for signatures. Signal's PQXDH work shows one pragmatic model for hybridizing classical and post-quantum key agreement: combine a conventional elliptic-curve component with a post-quantum KEM so the handshake does not rely on a single mathematical assumption.

For Hush Line, post-quantum readiness should be treated as roadmap analysis, not as an immediate production claim. Disclosure systems face "harvest now, decrypt later" concerns, but the practical migration path depends on recipient key formats, browser cryptography support, OpenPGP ecosystem support, ciphertext size, delivery compatibility, and usability. A premature post-quantum switch could create more operational risk than protection.

The right near-term posture is crypto-agility: versioned envelopes, explicit algorithms, source-backed claims, no hidden key generation, and a design path that can evaluate post-quantum recipient encryption when the ecosystem is ready enough for Hush Line's user base.

## Migration and Rollout Model

Hush Line's encrypted-field rollout strategy should remain phased:

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

## Usability and Accessibility Requirements

Hush Line cannot treat cryptography as a recipient-only engineering concern. The sender may be under time pressure, observation, stress, or device constraints. The recipient may be a journalist, lawyer, educator, board member, organizer, or administrator who needs a trustworthy intake path without becoming a cryptography expert.

That means modernization must preserve:

- no-account submission for senders
- clear recipient authenticity signals
- setup flows that make encryption completion obvious
- browser-first usage without mandatory app installation
- accessible copy and controls
- fallback behavior that avoids losing a submission when client-side encryption payloads are unavailable
- clear status language that does not overpromise confidentiality beyond the actual deployment model

Any future cryptographic upgrade that increases recipient setup burden must include product work that reduces mistakes. Stronger primitives do not help if recipients misconfigure keys or publish unusable intake pages.

## Risks and Open Questions

The most important risks are:

- **Overstated claims.** Hush Line must not describe transitional `envelope-fernet` as domain-bound AEAD.
- **Nonce misuse.** AES-GCM production writes require unique nonces, negative tests, and review of retry behavior.
- **Key loss.** A database backup without matching encrypted-field key material is not a complete recovery artifact.
- **Rollback complexity.** Format changes must keep old readers until rollback windows close.
- **Endpoint compromise.** Modernized encrypted fields do not solve compromised browsers, devices, recipients, or application servers.
- **Recipient ecosystem compatibility.** Moving beyond PGP requires careful migration because recipients already use PGP-capable mail workflows.
- **Post-quantum timing.** Hush Line should prepare for post-quantum migration without claiming production protection before recipient-key ecosystems and implementation choices are ready.

Open design questions include:

- Should future encrypted-field formats include key identifiers and multi-key readers?
- When should Hush Line introduce external key-service support for managed deployments?
- Should personal-server deployments use sealed local secret tooling?
- What recipient-key model would support browser-first, multi-recipient, and post-quantum-compatible encryption without forcing difficult setup onto non-expert recipients?
- What formal review should be required before any production recipient-encryption protocol change?

## Roadmap

Hush Line's practical roadmap should be:

1. Keep current Fernet production writes until the compatibility and rehearsal gates are complete.
2. Use `envelope-fernet` only as transitional compatibility when maintainers approve it for a deployment.
3. Promote AES-256-GCM from prototype to production encrypted-field writer only after test vectors, AAD contracts, release gates, and maintainer approval are complete.
4. Keep legacy Fernet and transitional envelope reads through the migration and rollback window.
5. Add key-rotation and key-identifier design as separate work, not as an implicit side effect of AEAD migration.
6. Evaluate HPKE and post-quantum recipient-encryption paths separately from server-side encrypted database fields.
7. Continue grounding every security claim in the actual deployed behavior, not in intended future architecture.

## Conclusion

Best-in-class crypto modernization for Hush Line is not a single algorithm swap. It is a disciplined migration from implicit formats to explicit envelopes, from context-free encrypted fields to domain-bound authenticated fields, and from informal operational assumptions to rehearsed release gates.

That work has to happen without disrupting the whistleblower's core path: find a trustworthy recipient, submit without creating an account, and avoid unnecessary exposure. It also has to be honest about boundaries. Server-side encrypted fields protect against database-only exposure. Recipient PGP supports disclosure delivery workflows. Future AEAD and post-quantum work can improve the system, but only when the migration plan, key lifecycle, test evidence, and user experience are strong enough to carry the change.

The modernization goal is simple to state and hard to execute: stronger cryptography, safer operations, fewer exaggerated claims, and no regression in the human workflow that Hush Line exists to protect.

## References

- [Hush Line AGENTS.md](https://github.com/scidsg/hushline/blob/main/AGENTS.md)
- [Hush Line use cases](https://github.com/scidsg/hushline/blob/main/docs/USE-CASES.md)
- [Encrypted Field Modernization ADR](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-MODERNIZATION-ADR.md)
- [Encrypted Field AEAD Evaluation](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-AEAD-EVALUATION.md)
- [Encrypted Field Migration Runbook](https://github.com/scidsg/hushline/blob/main/docs/ENCRYPTED-FIELD-MIGRATION-RUNBOOK.md)
- [Operational Key Management Design](https://github.com/scidsg/hushline/blob/main/docs/OPERATIONAL-KEY-MANAGEMENT-DESIGN.md)
- [RFC 9580: OpenPGP](https://www.rfc-editor.org/rfc/rfc9580.html)
- [RFC 9180: Hybrid Public Key Encryption](https://www.rfc-editor.org/rfc/rfc9180.html)
- [NIST SP 800-38D: Galois/Counter Mode and GMAC](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- [NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST post-quantum cryptography project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Signal PQXDH specification](https://signal.org/docs/specifications/pqxdh/)
- [Signal Double Ratchet specification](https://signal.org/docs/specifications/doubleratchet/)
- [W3C Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/)
