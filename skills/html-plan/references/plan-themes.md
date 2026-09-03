# Plan document themes

Pick one theme per plan. Apply its `:root` palette, load its fonts, and follow
the density rule below. Default is **Engineering**; use another when the content
or audience calls for it, or when asked.

## Density (applies to every theme)

Be space-efficient. Plans are dense technical documents, not marketing pages.
Tight vertical rhythm, modest section spacing, compact cards and lists, body
line-height ~1.5. Cap prose measure at ~68-72ch. Do not stretch content with
large gaps, oversized padding, or hero whitespace. A reader should see a lot per
screen without scrolling past air.

## Presets

Headings use the display font, body the body font, code the mono font. State
colors (good/amber/bad) belong in bars, borders, and dots, not in body text.

- **Engineering** (default), dark technical. `--bg #0e1014; --panel #161922; --text #e9ebf0; --muted #8a93a5; --border #282d39; --accent #7c9cff; --good #5ad1a8; --amber #f2b84b; --bad #ef6a6a; --radius 12px`. Display "Space Grotesk", body Inter/system, mono "JetBrains Mono".
- **Dev docs**, clean light. `--bg #ffffff; --panel #f6f8fa; --text #1f2328; --muted #656d76; --border #d0d7de; --accent #0969da; --good #1a7f37; --amber #9a6700; --bad #cf222e; --radius 8px`. Inter display+body, mono "JetBrains Mono". Crisp 1px rules; no callout tints, no zebra.
- **Soft modern**, airy light indigo. `--bg #f7f8fc; --panel #ffffff; --text #2a2e3a; --muted #6e7589; --border #e7e9f2; --accent #6c5ce7; --good #2bb673; --amber #e0a030; --bad #e05a6a; --radius 16px` with soft shadow. "DM Sans" display+body, mono "JetBrains Mono".
- **Reading**, serif long-form. `--bg #fbfaf8; --panel #f4f1ec; --text #23201b; --muted #6b6459; --border #e7e1d6; --accent #3a6a4f; --radius 6px`. "Source Serif 4" display+body, mono "JetBrains Mono". Single column.
- **Academic**, scholarly serif. `--bg #ffffff; --panel #f7f7f5; --text #1a1a1a; --muted #555555; --border #dcdcd6; --accent #1f3a5f; --radius 2px`. "Spectral" display+body, mono "JetBrains Mono". Footnote-style sources, print-first.
- **Slate**, calm warm dark. `--bg #1b1b20; --panel #232329; --text #e8e6e1; --muted #a09b91; --border #34343c; --accent #7fd1c0; --radius 10px`. Display "Space Grotesk", body Inter, mono "JetBrains Mono". Low glare.
- **Carbon**, IBM Plex enterprise. `--bg #ffffff; --panel #f4f4f4; --text #161616; --muted #525252; --border #e0e0e0; --accent #0f62fe; --good #24a148; --amber #f1c21b; --bad #da1e28; --radius 0`. "IBM Plex Sans" display+body, "IBM Plex Mono" mono. Squared.
