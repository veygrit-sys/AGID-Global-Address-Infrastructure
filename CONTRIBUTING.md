# Contributing to GeoGrid Explorer

First off, thank you for considering contributing to GeoGrid Explorer! It's people like you that make this tool great for everyone.

## How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue and include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- What you expected to happen vs what actually happened.
- Screenshots if applicable.

### Suggesting Enhancements
Have an idea to make GeoGrid Explorer better?
- Open an issue with the tag "enhancement".
- Explain why this feature would be useful.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the linter passes (`npm run lint`).
5. Small, focused pull requests are much easier to review and merge!

## Style Guide

### Programming Language Selection
- Default to TypeScript for UI, API orchestration, adapters, AddressIntent/Radar policy, and product-facing flows.
- Use Rust/WASM for deterministic numeric AGID core work, hidden predicate geometry, and measured high-volume workers.
- Use SQL/database-native features for persistence, spatial index, nullifier lookup, revocation lookup, audit queries, and cache/index logic.
- Use Solidity only for minimal public verification state such as issuer, commitment, revocation, nullifier, verifier, and payment contracts.
- Use Circom/ZK tooling for real proof circuits; TypeScript should prepare witnesses and orchestrate proofs, not replace circuits.
- Use Lean for abstract mathematical safety or impossibility claims, not for empirical GIS accuracy.
- Use Python for GIS experiments, document/PDF pipelines, and data analysis utilities, not as the main app runtime.
- Keep generated SDKs spec-driven and parity-tested against `sdk/agid-spec/test-vectors.json`.
- See `docs/programming-language-selection-policy-ja.md` and `src/lib/programmingLanguagePolicy.ts` before introducing a new runtime.

### JavaScript/TypeScript
- Use functional components for UI.
- Follow the existing Tailwind CSS naming patterns.
- Ensure type safety with TypeScript.

### Commit Messages
- Use descriptive commit messages (e.g., `feat: add Yahoo Map bridge`, `fix: grid line width at low zoom`).

## Questions?
Feel free to open a discussion issue!
