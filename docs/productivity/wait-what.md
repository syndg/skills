## What it does

`wait-what` is what you type when a message did not land. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) re-pitches what it just said, adds missing context, writes in plain English, and reuses the selected project vocabulary. Configured repositories follow [dox](https://aihero.dev/skills-dox)'s retrieval and reuse policy rather than treating a re-pitch as a new task. The unconfigured fallback uses the **Ubiquitous Language** inherited through the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries.

The skill is three lines long. That is the design, not an unfinished draft. Skills that fight verbosity fail by growing: a four-hundred-line concision skill still leaves the [model](https://www.aihero.dev/ai-coding-dictionary/model) verbose, because the model reads the volume, not the plea. This one carries a single precise leading word and nothing else.

## When to reach for it

You invoke it by typing `/wait-what`. The agent will not reach for it on its own, and it shouldn't. Only you know when you stopped following.

Use it the second you notice you're skimming. The agent has drifted into jargon it invented, stacked five acronyms, or explained a decision whose premise you never saw. It fixes the conversation you're already in. To stop the jargon arriving at all, use [grill-with-docs](https://aihero.dev/skills-grill-with-docs), which builds the shared language upfront.

## The name is the mechanism

The leading word is **wait**. "Be concise" is an instruction about the agent's output, and the model obeys it by clipping words and losing you further. **Wait** is about *your* state. It says comprehension failed here. An agent that hears "be brief" writes telegrams. An agent that hears "wait, you lost me" backs up and explains.

That difference is the whole skill. Every popular fix for verbosity names the *output*: `/tldr`, `/no-fluff`, `/talk-normal`. The model over-corrects into a caveman register that is shorter and no clearer. Naming the *listener* asks for both halves at once: fewer words **and** the context you were missing.

The skill says re-pitch **that**, not "that last message". What lost you is usually bigger than one paragraph, so the agent decides how far back to go.

## It plugs into the language you already have

The body reuses leading words already present in the standing instructions and the project's applicable domain contract. ASD-STE100 Simplified Technical English sets the register. The Ubiquitous Language supplies the nouns. The skill and the contract reach for the same [tokens](https://www.aihero.dev/ai-coding-dictionary/token), so invoking it is not a new instruction. It reminds the agent of one already in force.

If no relevant **Ubiquitous Language** is available from the selected project context, the skill still works. You lose only the domain-vocabulary half.

## Common questions

**Is this just `/tldr`?**

No. A summary can preserve the same missing premise in fewer words. `wait-what` asks the agent to back up, supply the context that failed to land, and use the project's established nouns.

**Does it change the project's Ubiquitous Language?**

No. It reads the applicable language and reuses it. If the terminology itself is wrong or ambiguous, use [domain-modeling](https://aihero.dev/skills-domain-modeling) to adjudicate and update the owning contract.

**What if the project has no domain contract?**

The skill still re-pitches in plain language. It simply has no project-specific vocabulary to reuse.

## It's working if

- The re-pitch is **shorter and clearer**, not shorter and blunter.
- It adds the premise you were missing, instead of only deleting words.
- Project nouns from the selected contract replace invented ones.
- You can use it twice in a row, and it does not degrade into terseness.

## Where it fits

You can use `wait-what` at any point, in any conversation, inside any other skill. It repairs one message after the fact. Shared language agreed upfront comes from [grill-with-docs](https://aihero.dev/skills-grill-with-docs), a [grilling](https://www.aihero.dev/ai-coding-dictionary/grilling) session that runs [domain-modeling](https://aihero.dev/skills-domain-modeling). Configured projects follow the installed DOX skill for retrieval and maintenance; only the unconfigured fallback keeps terms and inherited decisions at the nearest owning `AGENTS.md` scope. [Ask-matt](https://aihero.dev/skills-ask-matt) routes the moment.
