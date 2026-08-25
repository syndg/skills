---
name: unslop
description: Cut AI tells from any writing and restore a human voice. Must apply to every prose surface, including docs, READMEs, specs, plans, PR descriptions, commit messages, emails, and agent replies.
license: MIT
metadata:
  source: https://github.com/cursor/plugins/tree/bdf7aa355337897f167153e05069aca505dae17c/pstack/skills/unslop
---

# Unslop

Edit text to remove AI patterns and add human voice.

## Process

1. Scan for the patterns below.
2. Rewrite. Preserve meaning and match the intended tone.
3. Add soul (see the next section).
4. Self-audit: "What makes this obviously AI generated?" Fix the remaining tells.

## Guardrails

- **Project language wins.** Preserve exact code symbols and the canonical Ubiquitous Language from the applicable `AGENTS.md` chain or DOX receipt. A catalog word is not wrong when the project uses it precisely.
- **Evidence wins.** Do not change facts, measurements, citations, or quoted text to make prose smoother. Paraphrase a quote only when the author has permission to do so.
- **Voice wins.** These patterns are heuristics, not proof. Keep deliberate quirks that belong to the author or the audience.

## Adding soul

Removing patterns is half the job. Sterile, voiceless writing is just as obvious.

- **Have opinions.** React to facts instead of neutrally listing pros and cons.
- **Vary rhythm.** Short sentences. Then longer ones that take their time. Mix it up.
- **Acknowledge complexity.** "Impressive but also kind of unsettling" beats "impressive."
- **Use "I" when it fits.** First person isn't unprofessional.
- **Let some mess in.** Perfect structure looks machine-made.
- **Be specific.** Not "this is concerning" but "there's something unsettling about agents churning away at 3am."

## Patterns to detect and fix

### Content

1. **Puffery.** "pivotal moment", "testament to", "evolving landscape", "setting the stage for", "indelible mark", "deeply rooted". Cut puffery and state what happened.
2. **Name-dropping.** Listing media outlets without context. Pick one and say what was said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...". Delete them or expand them with real sources.
4. **Promotional language.** "nestled", "vibrant", "breathtaking", "groundbreaking", "renowned", "stunning", "must-visit". Use neutral descriptions.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some critics argue". Name the source or delete the claim.
6. **Formulaic challenges.** "Despite challenges... continues to thrive." Replace it with specific facts.

### Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace them with plain words.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has".
9. **"Not just X, but Y."** State the point directly.
10. **Rule of three.** Do not force ideas into groups of three. Use the natural number.
11. **Synonym cycling.** Protagonist, main character, central figure, and hero in one paragraph. Pick one and repeat it.
12. **False ranges.** "from X to Y" when X and Y are not on a meaningful scale. List the topics directly.

### Style

13. **Em dash overuse.** Avoid em dashes entirely. Use periods or commas only. Do not swap in parentheses, en dashes, or hyphens as fake dashes. If a thought needs separation, end the sentence or use a comma.
14. **Colon overuse.** Colons are fine before a list or example, not as routine mid-sentence connectors. Rewrite the sentence so the point stands on its own.
15. **Boldface overuse.** Do not bold every proper noun or acronym.
16. **Inline-header lists.** The tell is a bold label and colon that restates the line: "**Performance:** Performance improved..." Convert it to prose. A bold lead-in that ends in a period, names the item, and adds genuinely new detail is fine.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove them from headings and bullets.
19. **Curly quotes.** Replace them with straight quotes.

### Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!", "Certainly!", "Found the smoking gun!" Remove them.
21. **Cutoff disclaimers.** "While specific details are limited..." Find sources or remove the claim.
22. **Sycophantic tone.** "Great question! You're absolutely right!" Respond directly.

### Filler

23. **Filler phrases.** "In order to" becomes "To". "Due to the fact that" becomes "Because". Delete "It is important to note that".
24. **Excessive hedging.** "could potentially possibly be argued that it might" becomes "may".
25. **Generic conclusions.** "The future looks bright." State specific plans or facts.

### Jargon

26. **Abstract metaphor nouns.** Substrate, wedge, vector, locus, vantage, nexus, primitive (as a noun), harness (as a metaphor), surface (as in "API surface"), bedrock, scaffolding (as a metaphor), modality, paradigm, gold-plating, ratchet (as a metaphor), evacuate (for moving code), endgame, north star, flywheel. These often have a plainer concrete word. Use that word unless the project contract or code uses the term precisely.

### Plain speech

27. **Say what it does, not how it feels.** "the database stays close at hand", "SQL you can read", and "types that follow your schema" name a feeling. Name the mechanism or a number instead. Ask what the sentence tells the reader to do or know. If it could appear unchanged in another project's docs, it says nothing about this one.
28. **Shorten or split dense sentences.** If the reader has to backtrack, break the sentence in two or drop clauses. Keep one idea per sentence.
29. **Active voice.** Prefer it. Catch "is/are/was/were + past participle" and name the actor. Passive is fine when the actor is unknown or does not matter.
30. **Cut adverbs, or use a stronger verb.** "runs quickly" becomes "is fast" or the measured number. An adverb propping up a weak verb means the verb is wrong.
31. **Prefer the plain word.** "utilize" becomes "use", "leverage" becomes "use", "facilitate" becomes "help", "numerous" becomes "many", and "in the event that" becomes "if".
