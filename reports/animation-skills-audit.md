# Animation skills audit

Audited 2026-10-01. Sources are the installed local skills and their references. No skills were changed.

After the audit, the user requested removal of `web-animation-design` and `impeccable`. Both were removed. The inventory below records the pre-removal state; the current animation-family count is 17, comprising 15 dedicated animation skills and two supporting skills.

## Count and installation scope

The installed `~/.agents/skills` collection has **18 skills in the animation family**: 15 in the external animations.dev bundle, `web-animation-design`, and two Figma motion skills. Of these, **16 focus directly on animation**. `pick-ui-library` and `prototype-variants` cover broader UI work but belong to the same bundle and apply its animation standards.

Three other installed skills discuss motion substantially: `impeccable`, `frontend-design`, and `video-interaction-mapper`. Including those general design and interaction tools gives **21 related skills**, but that would overstate the number of dedicated animation skills.

There is an installation distinction. `~/skills` is the maintained repository; `~/.agents/skills` contains installations from several sources. The 15 animations.dev skills link to `~/.local/share/animations-dev-skills`, outside that repository. Only the three dedicated skills `web-animation-design`, `figma-use-motion`, and `figma-implement-motion` live in the repository's vendor bucket. Their installed copies match the repository copies, including references. The [vendor inventory](/home/syndg/skills/skills/vendor/README.md:13) lists the Figma pair and [web-animation-design](/home/syndg/skills/skills/vendor/README.md:29).

## Inventory

| Skill | Job | Classification |
| --- | --- | --- |
| [animate](/home/syndg/.agents/skills/animate/SKILL.md:10) | General motion decisions and implementation, with CSS, Motion and SVG references | Animation |
| [animation-accessibility](/home/syndg/.agents/skills/animation-accessibility/SKILL.md:12) | Reduced-motion variants, loops, autoplay and smooth scrolling | Animation |
| [animation-performance](/home/syndg/.agents/skills/animation-performance/SKILL.md:10) | Frame budget, rendering cost and animation drivers | Animation |
| [animation-vocabulary](/home/syndg/.agents/skills/animation-vocabulary/SKILL.md:10) | Name effects from informal descriptions | Animation |
| [css-animations](/home/syndg/.agents/skills/css-animations/SKILL.md:10) | CSS transitions, keyframes, transforms and clip-path | Animation |
| [debug-animation](/home/syndg/.agents/skills/debug-animation/SKILL.md:10) | Diagnose one animation before editing | Animation |
| [find-animation-opportunities](/home/syndg/.agents/skills/find-animation-opportunities/SKILL.md:11) | Read-only report on where motion should be added or avoided | Animation |
| [gesture-ui](/home/syndg/.agents/skills/gesture-ui/SKILL.md:10) | Direct manipulation, drag release, sheets and hold gestures | Animation |
| [improve-animations](/home/syndg/.agents/skills/improve-animations/SKILL.md:11) | Codebase audit and implementation plans | Animation |
| [motion-brief](/home/syndg/.agents/skills/motion-brief/SKILL.md:10) | Interview the user into a motion specification | Animation |
| [motion-react](/home/syndg/.agents/skills/motion-react/SKILL.md:10) | Motion for React API and component recipes | Animation |
| [review-animations](/home/syndg/.agents/skills/review-animations/SKILL.md:17) | Diff review with findings and a block/approve verdict | Animation |
| [scroll-animations](/home/syndg/.agents/skills/scroll-animations/SKILL.md:10) | Scroll reveals, scrubbed motion, parallax and restraint | Animation |
| [pick-ui-library](/home/syndg/.agents/skills/pick-ui-library/SKILL.md:12) | Choose an animation library or UI dependency | Adjacent; bundle member |
| [prototype-variants](/home/syndg/.agents/skills/prototype-variants/SKILL.md:9) | Build multiple UI directions behind a visual picker | Adjacent; bundle member |
| [web-animation-design](/home/syndg/.agents/skills/web-animation-design/SKILL.md:20) | General motion decisions and implementation tips | Animation |
| [figma-use-motion](/home/syndg/.agents/skills/figma-use-motion/SKILL.md:18) | Author or inspect Figma keyframes, styles and timelines | Animation; Figma |
| [figma-implement-motion](/home/syndg/.agents/skills/figma-implement-motion/SKILL.md:19) | Translate Figma motion into application code | Animation; Figma |

## Emil Kowalski and other sources

Most of this is one school of motion design. `animate` explicitly describes itself as distilled from Emil Kowalski's *Animations on the Web* course. The CSS and Motion skills claim specific course modules; review, audit, scroll, vocabulary and scouting skills apply the course's standards. `prototype-variants` explicitly applies Emil's standards. `motion-brief` repeats the same rules and connects to the bundle, although its main file does not explicitly credit the course.

`web-animation-design` also says it is based on Emil's course. Therefore, the biggest overlap is **two guides drawing on the same course**, rather than a clean split between Emil and another animation author. These attribution statements establish the claimed source of the advice. They do not establish that Emil wrote or published these skills. The external 15-skill installation has no repository URL, author metadata or Git checkout that would verify its packaging provenance.

There are other influences inside the course-derived material:

- [animation-performance](/home/syndg/.agents/skills/animation-performance/SKILL.md:10) explicitly adds mechanics from Motion's performance guide.
- The [CSS tab-highlight recipe](/home/syndg/.agents/skills/css-animations/RECIPES.md:249) credits Paco Coursey for the technique.
- [motion-react](/home/syndg/.agents/skills/motion-react/SKILL.md:112) links to nan.fyi's explanation of Magic Motion.
- [pick-ui-library](/home/syndg/.agents/skills/pick-ui-library/SKILL.md:88) includes torph and DialKit from an unnamed guest lesson.
- [review-animations](/home/syndg/.agents/skills/review-animations/SKILL.md:17) says its review method was adapted from aggressive code-quality review; it does not identify an author.
- [web-animation-design's practical tips](/home/syndg/.agents/skills/web-animation-design/PRACTICAL-TIPS.md:274) link to easings.co and quote Paul Graham at line 301.

The two Figma motion skills are a separate tool-specific family. The repository [credits Figma](/home/syndg/skills/skills/vendor/README.md:13). They provide APIs and design-to-code procedures, rather than another general motion aesthetic.

Outside the dedicated family, [impeccable](/home/syndg/.agents/skills/impeccable/SKILL.md:8) says it is based on Anthropic's frontend-design skill, and the vendor inventory [credits frontend-design to Anthropic](/home/syndg/skills/skills/vendor/README.md:6). These introduce another set of motion recommendations when general frontend work triggers them.

## Duplicates and overlap

There are **no byte-identical `SKILL.md` files under different installed skill names**. SHA-256 comparison of all 98 installed skill files found no duplicate groups. Comparing the 27 Markdown files in the 15-skill bundle plus `web-animation-design` also found no identical whole files. The matching repository and installed vendor copies are installation copies, not additional distinct skills.

| Overlap | Finding | Recommendation |
| --- | --- | --- |
| `animate` and `web-animation-design` | Strong functional duplication. Both trigger broadly on motion, easing, springs, performance, accessibility and common UI components. Both contain the same easing decision tree, frequency rule, scale-on-press, GPU advice, hover fixes and recording workflow. | Use one general entry point. `animate` has broader specialist references and better-defined cross-links. |
| `animate/css-techniques.md` and `css-animations` | The companion reference repeats transitions/keyframes, transforms, 3D, hover, toast stacks, clip-path and stagger material. Specialists add more detail. | Keep the CSS specialist; have the general entry point reference it instead of maintaining a parallel recipe file. |
| `animate/framer-motion.md` and `motion-react` | Repeats springs, AnimatePresence, variants, layout, height measurement, motion values and component recipes. | Keep `motion-react` as the implementation reference. |
| `animate`, `review-animations/STANDARDS.md`, `improve-animations/AUDIT.md` | The same motion rules and numerical values recur in three catalogs. Their workflows differ, but the standards have multiple owners. | Keep review and planning workflows; consolidate the standards they read. |
| `debug-animation` and `animation-performance` | Share dropped-frame causes and fixes. Debugging also covers feel, exits, origin and hover failures. | Keep both; the debugging skill already hands deeper profiling to the specialist. |
| `find-animation-opportunities` and `improve-animations` | Both inspect a codebase. One scouts missing motion; the other fixes existing motion and includes a missed-opportunities category. | Keep separate only if their deliverables remain clearly distinct. |
| Figma pair | One writes Figma nodes; one writes application code from Figma data. | Keep both. They complement each other. |

Some passages are copied exactly, even though entire files are different. The stacked-card CSS is an identical 11-line block beginning at [animate/css-techniques.md:95](/home/syndg/.agents/skills/animate/css-techniques.md:95) and [css-animations/RECIPES.md:127](/home/syndg/.agents/skills/css-animations/RECIPES.md:127). An eight-line AnimatePresence block appears at [animate/framer-motion.md:50](/home/syndg/.agents/skills/animate/framer-motion.md:50) and [motion-react/SKILL.md:72](/home/syndg/.agents/skills/motion-react/SKILL.md:72). Reduced-motion CSS is an identical eight-line block at [animate/SKILL.md:178](/home/syndg/.agents/skills/animate/SKILL.md:178) and [review-animations/STANDARDS.md:210](/home/syndg/.agents/skills/review-animations/STANDARDS.md:210).

The distinct workflows are useful. The duplication problem is mostly repeated standards and implementation recipes, plus two broad entry points competing for the same request.

## Recommendations that disagree

| Topic | Conflicting advice | Consequence |
| --- | --- | --- |
| Reduced motion | [web-animation-design:253](/home/syndg/.agents/skills/web-animation-design/SKILL.md:253) requires disabling all animation, explicitly including opacity/color at line 271. [animation-accessibility:23](/home/syndg/.agents/skills/animation-accessibility/SKILL.md:23) says to preserve meaningful fades/colors and remove movement. [impeccable's animation reference:144](/home/syndg/.agents/skills/impeccable/reference/animate.md:144) forces all durations to 0.01ms with `!important`. | The same modal can receive three different reduced-motion implementations. This is the clearest conflict to resolve. |
| Hover scale | [web-animation-design:297](/home/syndg/.agents/skills/web-animation-design/SKILL.md:297) and [impeccable:59](/home/syndg/.agents/skills/impeccable/reference/animate.md:59) show or permit 1.05. [animate:118](/home/syndg/.agents/skills/animate/SKILL.md:118) recommends 1.02, and [review-animations:61](/home/syndg/.agents/skills/review-animations/SKILL.md:61) flags more than 2%. | A builder can generate a hover that the reviewer immediately rejects. |
| Bounce | [impeccable:94](/home/syndg/.agents/skills/impeccable/SKILL.md:94) bans bounce and elastic easing. [animate:140](/home/syndg/.agents/skills/animate/SKILL.md:140) defaults bounce to zero but permits deliberate drag-release and personality choices; its [Dynamic Island recipe](/home/syndg/.agents/skills/animate/framer-motion.md:157) uses substantial bounce. | The selected design skill changes what counts as acceptable physical feedback. |
| Layout properties | [animate:151](/home/syndg/.agents/skills/animate/SKILL.md:151) says only animate transform/opacity. [motion-react:114](/home/syndg/.agents/skills/motion-react/SKILL.md:114) teaches measured-height animation. The reviewer [allows limited exceptions](/home/syndg/.agents/skills/review-animations/SKILL.md:39), but its own [standards:171](/home/syndg/.agents/skills/review-animations/STANDARDS.md:171) also prescribe height animation without applying that qualification. | The general rule needs an explicit exception for justified, measured layout changes. |
| Fade-only entrances | [review-animations:52](/home/syndg/.agents/skills/review-animations/SKILL.md:52) flags pure fades with no transform. Its [standards:185](/home/syndg/.agents/skills/review-animations/STANDARDS.md:185) permit unimportant stagger items to fade, and [accessibility:36](/home/syndg/.agents/skills/animation-accessibility/SKILL.md:36) prescribes fade-only reduced-motion modals. | The escalation rule is too broad and can reject approved recipes. |
| Keyboard-triggered motion | [animate:58](/home/syndg/.agents/skills/animate/SKILL.md:58) and [review-animations:54](/home/syndg/.agents/skills/review-animations/SKILL.md:54) forbid it. [motion-react's tab recipe:228](/home/syndg/.agents/skills/motion-react/RECIPES.md:228) drives an animated shared-layout indicator from `onFocus`, explicitly including keyboard navigation. | Another builder/reviewer conflict inside the same bundle. |

Some numerical differences are context-dependent rather than contradictions. Scroll reveals allow 400–600ms and 80–120ms stagger on marketing pages; the general guide uses shorter product timings. The bundle repeatedly distinguishes marketing from product. Duration tables should preserve that distinction instead of treating every difference as a duplicate defect.

Figma translation needs its own precedence rule. [figma-implement-motion:116](/home/syndg/.agents/skills/figma-implement-motion/SKILL.md:116) requires exact timing, easing and keyframe values from the design. A generic reviewer may dislike those values, but changing them silently would break the translation contract. Generic craft guidance should offer a separate design critique when fidelity is the requested task.

## Suggested cleanup

Make `animate` the general motion entry point and retire or narrow `web-animation-design`. Preserve the specialist skills and their separate workflows. Move shared standards into one reference, then resolve reduced-motion, bounce, hover-scale and layout exceptions there. Keep both Figma skills, with design fidelity taking precedence during translation. Keep general design guidance such as `impeccable` out of the dedicated animation count, and document how its motion preferences interact with the animation standards.

This is a recommendation only. The audit did not delete, edit, relink or disable any skill.
