# Stripe Design Crit Tool

A little app for running design crits and iterating on designs — with an AI taste critic built in, trained on Stripe's design principles.

**Two modes:**
- **Team Design Critique** — run a structured crit session, collect feedback from reviewers, and get AI taste notes alongside human ones
- **Iterate** — drop a design, get AI feedback, push back on it, refine

---

## Setup (takes about 2 minutes)

**Prerequisites:** Node.js and Claude Code installed. That's it. No API keys needed.

```bash
git clone https://github.com/sisi-stripe/stripe-design-crit.git
cd stripe-design-crit
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're in.

> The AI critique runs through your local Claude Code session — no separate API key or account needed. If you have Claude Code, you're good.

---

## How the AI critic works

The AI is trained on Stripe's taste principles — activation-state calibration, earned white space, purposeful density, Sail UI alignment, overlay/gradient rules, icon clarity, and functional motion. It gives you 4–6 critique items per design, with:

- **Kudos** — what's genuinely working
- **Questions** — things worth thinking about
- **Consider** — directional suggestions
- **Blocking** — stuff that needs to change

You can drop in a Figma URL or drag a screenshot directly onto the canvas. Either way it'll give you something to react to.

---

## Figma integration

Add your Figma access token to a `.env.local` file in the project root:

```
FIGMA_ACCESS_TOKEN=your_token_here
```

Get a token at figma.com → Settings → Personal access tokens. Without it, the Figma preview won't load but everything else still works.

---

## Questions / bugs

Ping @sisi in Slack or open an issue on the repo.

