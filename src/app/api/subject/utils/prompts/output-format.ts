export const OUTPUT_FORMAT_NOTICE = `
### Output Format

Reply in Markdown format without using emojis, icons, or decorative symbols. Use clear headers, bullet points, numbered lists, and standard Markdown formatting only. Again, never include emojis`;


export const getExampleCitations = (count: number) => `
### Citations

Include at least ${count} studies in this format at the end of the output. 
**Important:** Only include studies that achieve **confidence = 5** (see rules). 
If fewer than ${count} studies meet the threshold, include only those that do; do not mention or cite any others.

<example>
    1. [Author Name] (Year). "Title of Study"
    [Brief summary of the study, one sentence]
    Type: [e.g., Randomized Controlled Trial, Systematic Review, Cohort Study]

    Relevance: [Relevance of the study to the nonprofit, one sentence]
    Citation: [Author Name] (Year). "Title of Study". [Journal Name], [Volume], [Issue], [Page Range]. DOI: [DOI]
    Link: Markdown link of the actual link: e.g. [https://www.science.org/doi/10.1126/science.1204534](https://www.science.org/doi/10.1126/science.1204534)
</example>

So again, include author, title of study, type of study and where to find a full version in a link. Include a hyperlink to all studies cited.

---

### Strict Omission Policy (applies to BOTH main text and citations)

- **Only use sources with confidence = 5.**
- **Do not** quote, paraphrase, summarize, or reference any study with confidence < 5 anywhere in the main text.
- **Do not** list any study with confidence < 5 in the "Citations" section.
- **Do not** include a "discarded" list or mention omitted sources.

---

### Link Verification Rules (for both Claude and ChatGPT) — *perform internally; do not display details*

1) **HEAD verification (internal)**
   - For every "Link", issue an HTTP **HEAD** request to the exact URL.
   - A link is **valid only if the FINAL response to HEAD is 200**.

2) **Redirect handling (internal)**
   - If the initial response is 3xx (301/302/303/307/308), FOLLOW the redirect using **HEAD** (not GET), up to **MAX_REDIRECTS = 10**.
   - Treat **303 See Other** like other redirects—issue **HEAD** to the Location target (do **not** switch to GET).
   - If a loop is detected or MAX_REDIRECTS is exceeded, treat as not valid.

3) **Soft-404 check (internal; after final HEAD=200)**
   - Issue a lightweight **GET** to the final URL and verify that it is a real article page:
     - Require at least **2** scholarly signals among: 
       \`meta[name="citation_title"]\`, \`meta[name="citation_author"]\`, \`meta[name="citation_doi"]\` (matching the cited DOI), or JSON-LD with \`"@type":"ScholarlyArticle"\`.
     - Reject pages whose \`<title>\` or body indicates soft 404 (e.g., "not found", "404", "removed", "moved", "error") or that lack scholarly signals.

4) **Non-200 terminal statuses (internal)**
   - **404/403/401/405/429/5xx** or anti-bot codes: treat as not valid.
   - If a primary URL fails, you may locate an **alternate authoritative source** (publisher landing, DOI resolver, PubMed, arXiv, institutional repository) and verify that alternate via the same steps.

5) **DOIs (internal)**
   - Prefer \`https://doi.org/{doi}\`. Verify with HEAD (after redirects) and pass the soft-404 check.

6) **Confidence scoring (internal; 0–5)**
   - **5**: HEAD=200, passes soft-404 check, on an **authoritative domain** (publisher, DOI, PubMed, arXiv, university repository) and metadata matches the citation.
   - **4**: Same as above but on a reputable aggregator/stable archive (e.g., NIH PMC mirror, JSTOR) with consistent metadata.
   - **3**: HEAD=200 and soft-404 passes but on a secondary site (mirror/excerpt) with consistent metadata.
   - **1–2**: HEAD not 200 or unsupported, or soft-404 failed; partial corroboration only.
   - **0**: Dead/mismatched link, unreliable domain, or no corroboration.
   - **Omission rule:** Only confidence **= 5** may be used or cited. Everything else must be omitted.

7) **No hallucinated links**
   - Only include a "Link" that **passed** HEAD (final 200) **and** the soft-404 check at confidence 5.
   - If no authoritative, verifiable link is found at confidence 5, omit the study entirely.

---

### Visible Verification Note (single line)
- Include **exactly one** line at the very end of the visible output **only if** at least one candidate source was omitted for failing verification:
  **Verification note:** _Some sources were omitted after URL checks._
- Do **not** include counts, URLs, titles, or details. If no sources were omitted, do not include this line.

---

### Hidden Diagnostics Block (must be included, will be stripped by the system)
At the very end of your response, output a machine-readable JSON block **between these exact markers**. Do not mention it in the visible text.

[[[VERIFICATION_LOG]]]
{
  "items": [
    {
      "index": <1-based citation index or "attempted">,
      "url_tested": "<original URL>",
      "status_chain": [<e.g., 302, 200>],
      "final_url": "<terminal URL>",
      "is_valid": <true|false>,
      "reason_if_not_valid": "<short reason or empty>",
      "confidence": <0..5>
    }
    // one entry per attempted source (including omitted ones)
  ],
  "notes": "Only confidence=5 sources appear in visible text and citations. A single-line 'Verification note' may be shown if any were omitted."
}
[[[/VERIFICATION_LOG]]]

### CRITICAL: Visible Output Requirements 

**NEVER show any of the following in your response to users:**
- Verification logs, status updates, or progress indicators
- HTTP status codes, URLs being tested, or redirect chains  
- Confidence scores or validation details
- "Checking URL..." or "Verifying link..." messages
- Any technical diagnostic information
- The [[[VERIFICATION_LOG]]] JSON block (this is automatically stripped by the system)

**Only show users:**
- Clean, well-formatted research content
- Final citations for confidence-5 sources only
- Optional single-line verification note if sources were omitted (as specified above)

**The verification work must be completely invisible to users. They should only see the final research output with validated citations.**
`;



