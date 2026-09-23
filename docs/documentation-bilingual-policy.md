# Documentation Bilingual Policy

Last updated: 2026-06-07

## Purpose

AGID/AOID documentation should not leave a Japanese-only document without an English counterpart when the topic is part of the project specification, security model, paper, API, SDK, QR/NFC behavior, ZK proof model, AGID/AOID design, or public release material.

Japanese can remain the drafting language, but English must exist as an international specification or paper-facing version.

## Naming Rule

Use paired filenames whenever possible:

```text
topic-ja.md
topic-en.md
```

For papers:

```text
address-morphism-theory-...-ja-v1.md
address-morphism-theory-...-en-v1.md
```

English-language manuscripts and PDFs must use English filenames. Prefer the `-en` language suffix, for example:

```text
address-morphism-theory-full-paper-en-v3.md
address-morphism-theory-full-paper-en-v3.pdf
```

If an older document already has another naming convention, add a clear English companion and link both from an index or resume.

## Minimum Companion Requirements

An English companion does not need to be a literal translation. It must preserve:

1. The same core claims.
2. The same security boundaries.
3. The same implementation file references.
4. The same verified/unverified status.
5. The same warnings and limitations.
6. Any theorem, axiom, lemma, proposition, or counterexample that appears in the Japanese version.

If the English version intentionally differs, state whether it is:

- translation,
- international-paper rewrite,
- specification rewrite,
- summary companion,
- or implementation note.

## Current Immediate Rule

When adding a new Japanese document under `docs/`, also add one of:

1. an English counterpart in the same turn;
2. an English stub that marks the document as pending translation;
3. a note in `docs/project-resume.md` that the English counterpart is pending.

For security, privacy, QR, NFC, ZK, AGID/AOID, and API material, option 1 is preferred.

## Audit Command

Use this rough audit to find Japanese-oriented documents:

```powershell
Get-ChildItem docs -Filter *.md |
  Where-Object { $_.Name -match '-ja|japanese|日本語|資料' } |
  Select-Object Name
```

Then check whether each has an English companion by topic, not only by exact filename.

## QR Documentation Pair

The QR material is now paired:

- Japanese: `docs/agid-aoid-qr-materials-ja.md`
- English: `docs/agid-aoid-qr-materials-en.md`
