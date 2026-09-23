# PDF Source Inventory and Handling Policy

Last reviewed: 2026-06-13

## Scope

Most repository documents are Markdown source files under `docs/`. PDF files currently observed are primarily outside the repository under:

`C:\Users\kitau\Downloads`

This file records how to treat those PDFs. It does not import, move, delete, or publish them.

## Observed PDF Categories in Downloads

| Category | Count | Handling |
| --- | ---: | --- |
| Project research PDFs | 31 | Review and selectively convert into source Markdown/LaTeX if still relevant. |
| Product/business PDFs | 19 | Keep outside repository unless they become public product collateral. |
| Personal career PDFs | 8 | Do not commit. Keep private and separate. |
| Uncategorized PDFs | 17 | Review manually before any use. |

## Project Research PDFs Worth Reviewing

Examples found in Downloads:

- `住所写像論（英文）.pdf`
- `住所写像論（原文）.pdf`
- `住所参照不可能性定理.pdf`
- `住所保存則.pdf`
- `「住所同値類安定性」.pdf`
- `住所エントロピーは.pdf`
- `住所相対性原理.pdf`
- `ZK_Address_Theorem（住所零知識証明定理）.pdf`
- `847db9e5-5af6-42fb-8687-7f161ed34b85_Address_No_Free_Lunch_Theorem（住所版NFL定理）.pdf`
- `AGID_基礎変換系_全数式.pdf`
- `合意・履歴・測度の可換図式.pdf`
- `基本集合.pdf`
- `命題.pdf`
- `測度.pdf`
- `履歴.pdf`
- `合意.pdf`
- `地理構造.pdf`

Recommended action: treat these as source evidence or historical drafts. If reused, extract the useful claims into Markdown/LaTeX and cite the PDF path internally until a clean source file exists.

## Product / Business PDFs

Examples found in Downloads:

- `pichdeck*.pdf`
- `MVP*.pdf`
- `市場調査*.pdf`
- `機能説明*.pdf`
- `Vey*.pdf`
- `Veygrid_user*.pdf`
- `VeyForm_Technical__Data_Asset_Configuration_Summary.pdf`
- `Vey_Product_Roadmap_Ver_1.0__2.0.pdf`
- `Vey_MVP_Feature_Definition.pdf`
- `Veyform_事業要綱：グローバル・ロジスティクス・OS.pdf`

Recommended action: do not mix with AMT/AGID papers. If needed, create a separate product-collateral index and scrub metadata before publication.

## Personal / Career PDFs

Examples found in Downloads include resume, work-history, interview, and job-fair documents.

Recommended action:

- Never commit to this repository.
- Never include in public release bundles.
- Keep separate from AGID/AMT project material.
- If a cleanup script is added later, it should explicitly exclude these files.

## PDF Release Policy

Generated PDFs should be treated as release artifacts, not source of truth.

Preferred source order:

1. Markdown or LaTeX source in `docs/`.
2. Verification notes under `docs/chapter-verification/`.
3. Generated PDF in `output/pdf/` only after visual QA.
4. External historical PDF in Downloads only as private reference.

Before any PDF is published:

1. Confirm it has a source Markdown/LaTeX file.
2. Confirm claims match current verification boundaries.
3. Render and visually inspect pages.
4. Scrub private metadata.
5. Use English filenames for public English PDFs.
6. Keep Japanese filenames only for Japanese-public or Japanese-source artifacts.

## Do Not Import Automatically

The Downloads folder contains mixed project, product, and personal files. Automatic import would risk privacy leaks and public-release confusion. Manual selection is required.
