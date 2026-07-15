# Image and Documents from Supplier and Repairer Side — Design Brief

**Owner:** Shereen
**Status:** Draft — design direction, not yet a PRD (`challenge:` and `prd:` still to run)
**Source:** [Notion — INTERNAL Initiative: Repairer/Supplier Image Upload](https://app.notion.com/p/39cfbd28812a803a8674c31cf6f2f589)
**Mockups:** `Mockups/supplier-upload-mockup.html`, `Mockups/repairer-image-display-mockup.html`

---

## Problem

Suppliers responding to an RFQ on PartsCheck are capped at exactly three file uploads per quote, via a legacy "Attach Files to Quote" modal with no drag-and-drop, no previews, and no way to say *which part* a photo belongs to. On the other side, when a repairer reviews a quote, supplier-submitted photos land in the Documents tab as a flat `Supplier / FileName / Download` table — no thumbnails, no grouping by part, nothing the repairer can act on without downloading each file individually. When multiple suppliers respond to the same RFQ, there is currently no way to see, per part, what each competing supplier actually attached.

## Requirements

1. **Supplier — remove the 3-file cap and modernise the upload experience.**
2. **Supplier — allow photos to be attached to an individual part/line item**, not just to the quote as one undifferentiated bundle. This is a data-model change (photo → part), not a restyle — it's what makes Requirement 3 possible.
3. **Repairer — properly categorise and display photos from multiple suppliers against the same part**, so they're easy to actually view during quote comparison, not dumped in an undifferentiated list.

## Current state (screenshots reviewed)

| Screenshot | What it shows |
|---|---|
| Legacy "Attach Files to Quote" modal | Exactly three `Choose File` rows, no previews, no part association — the literal cap in Req 1 |
| FlexiQuote "Quote Options" toolbar | `Photos` is already a distinct concept from `Attach File` on the repairer's own quote-creation screen |
| Repairer's photo lightbox | Thumbnail rail + zoomed main image — an existing, working pattern worth reusing rather than reinventing |
| PartsCheck quote view, INFO tab | Repairer's own photos shown as a clean thumbnail gallery ("IMAGES (5 attached)") |
| PartsCheck quote view, DOCUMENTS tab | Supplier-submitted files as a flat table — no previews, no part grouping. This is the core pain point Req 3 fixes. |

## Design direction

**Supplier upload (Req 1 + 2):** The mockup deliberately keeps today's actual supplier quote screen unchanged (Quote Status bar, Purchaser Notes, Quote Options toolbar, parts table with Type Requested/Notes/Alt columns) — only the "Attach File" flow and a new per-row "Photos" column are new, so this reads as an incremental upgrade to a screen suppliers already know, not a redesigned product. The new flow: uncapped drag-and-drop / multi-select uploader, thumbnail grid with per-photo remove and upload progress, and a part-tag selector (defaulting to "whole quote — general" or the specific part the supplier clicked "Attach photos" from). See `supplier-upload-mockup.html` — includes a live toggle back to the legacy 3-slot modal for direct before/after comparison.

**Repairer display (Req 3):** Three places this lands, following an information-architecture change decided 15 Jul 2026 (Shereen): photos — both the repairer's own and every supplier's — no longer live in Documents at all. Documents is now for actual paperwork only (PDFs, invoices, compliance certs).

- **New Images tab** (sits alongside Check Price / Info / Documents) — replaces the old "photos buried in Documents" pattern entirely. Two sections: "Your Photos" (the repairer's own reference/damage photos, already-proven thumbnail gallery), and "Supplier Photos" (grouped by supplier, then by part within each supplier — supplier-first because you're scanning "what did each supplier send me"; the part-first comparison view lives on the grid screen instead). Both sections share the same lightbox.
- **Documents tab** — reworked to hold only non-photo attachments (e.g. compliance certificates, invoices), with a callout linking across to the Images tab so nothing is a dead end for anyone looking for photos out of habit.
- **Grid screen** (comparing multiple suppliers' responses to one RFQ, part by part — the highest-value UI moment in PartsCheck's core workflow) — `repairer-image-display-mockup.html` originally offered 4 candidate interaction patterns; **decided (Shereen, 14 Jul 2026): thumbnail preview under each supplier's price, click to open a single lightbox grouped by supplier for that part.** No new grid column, no extra click to reveal, works without hover (tablet-friendly). The other three (expandable row, dedicated Photos column, always-visible strip) were dropped as too cluttered. The mockup no longer shows a separate camera icon next to the part name — the per-supplier thumbnail is the only entry point, and it already opens the full cross-supplier comparison view.

The Info tab was also brought in line with the real product's Quote Basic Info / Vehicle Info fields (Quote #, Estimator, Claim No., Status, Active Margin Rule; Make/Model/VIN/Rego etc.) for chrome fidelity — no functional change there, it was previously a placeholder.

**General (whole-quote) vs. part-specific photos (15 Jul 2026):** Since Req 2 lets a supplier tag a photo to a part, the natural follow-up is: what if they don't — i.e. they attach photos to the quote as a whole, same as today? Both need to coexist without the repairer confusing one for the other. Resolved as:
- **Grid screen** — a small amber "📦 General N" badge appears once, in the supplier's column header, if that supplier has whole-quote photos. It never repeats per row (a general photo isn't "for" any one part), and it opens a lightbox scoped to just that supplier's general photos.
- **Images tab, Supplier Photos section** — each supplier's card shows a distinctly-styled amber "General — attached to the whole quote, not a specific part" block first (if any), followed by their per-part groups in the normal style. The mockup demonstrates all four real combinations so the pattern can be reviewed against each: OEM Direct (general + part-specific), Parts Network (part-specific only), ATS Parts (general only), Reco Centre (responded, no photos either way).
- **Bulk download** — added "Download All" at three levels: the whole quote (repairer + every supplier), the repairer's own photos, and per-supplier (counts include that supplier's general + part photos together). Simulated in the mockup (toast + photo count) since there's no real file storage to zip.

**Coexisting with "Modify Part Number" (15 Jul 2026):** Flagged from a real screenshot — clicking a priced grid cell today opens the existing "Modify Part Number" pricing flow (method + markup %), and the cell's top-right corner is already reserved by the real product for a part-number-match indicator. The photo thumbnail can't sit in either of those without competing with existing, high-frequency functionality. Resolved by making it a third, physically separate hit target on the same cell: the price/markup/ETD block keeps its full click → Modify (unchanged), the top-right corner stays clear for the part-number-match indicator, and the photo indicator sits in the top-left corner instead with its own click → photo lightbox. None of the three can trigger another. Worth a heads-up to whoever owns Modify Part Number / the match indicator (Mat Roggenkamp / IRO side) since this cell is jointly "owned" by two initiatives now.

## Open questions

- **Engineering — data model** — per-part photo tagging (Req 2) requires a photo → part_id relationship that doesn't exist today. Needs sizing with Mat Roggenkamp before this becomes a committed scope item.
- **FlexiQuote dependency** — FIU-1 (critical photo-persistence bug in FlexiQuote's own uploader) is unrelated to this PartsCheck-side work, but if repairer-sourced photos (uploaded upstream in FlexiQuote) are expected to flow through cleanly into what's redesigned here, that dependency is worth naming to Aju/engineering rather than assuming it's solved.
- **New Images tab — nav/IA impact** — adding a 4th top-level quote tab is a bigger change than a same-tab redesign; worth checking with Aju/design whether a new tab is the right call platform-wide versus, say, a sub-section within an existing tab, since it changes muscle memory for every repairer, not just this workflow.

## Product Thinking Lens flags

- **Insurer sensitivity:** none — no pricing or rules exposure.
- **Leakage risk:** low. Better part-level photo visibility reduces disputes about what was actually quoted rather than creating a new off-platform pathway — but worth a one-line mitigation note if this ever surfaces full-resolution originals or contact metadata.
- **Adoption risk:** low. Suppliers already attach photos today, just capped at three — removing the cap is a pure win with no new behaviour required. Per-part tagging (Req 2) adds one extra decision per upload for suppliers, worth user-testing before committing to it as mandatory vs. optional.
- **Repairer friction:** net reduction — replaces a download-per-file workflow with inline previews.
