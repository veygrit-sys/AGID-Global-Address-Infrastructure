# Publishing

This folder is ready to become a standalone GitHub repository after review.

Recommended owner for open-source geography packs:

```text
dawnportinfo-design/agid-open-sj-svalbard-and-jan-mayen-gazetteer
```

## Create And Push

Run these commands from a clean temporary copy of this folder, not from inside
the AGID monorepo worktree:

```powershell
gh repo create dawnportinfo-design/agid-open-sj-svalbard-and-jan-mayen-gazetteer --public --description "AGID source-linked gazetteer seed for Svalbard and Jan Mayen"
git init
git add .
git commit -m "Seed SJ AGID gazetteer pack"
git branch -M main
git remote add origin https://github.com/dawnportinfo-design/agid-open-sj-svalbard-and-jan-mayen-gazetteer.git
git push -u origin main
```

## Pre-Publish Checks

- Confirm no raw personal addresses, recipient records, private coordinates, witness material, proof secrets, or private keys are present.
- Confirm every source in `sources.json` has a license review state.
- Confirm `data/place-seed.json` only contains public place names and source links.
- Confirm upstream data has not been imported unless redistribution is approved.
