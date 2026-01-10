# Product Strategy Roadmap

## Strategic Decision Required

**Core Problem:** Creativity Guard serves two audiences (distraction blocking + AI mindfulness) with no clear primary value proposition. This dilutes both.

**Decision:** Choose ONE primary path:

| Path | Primary Focus | Differentiation | Market |
|------|--------------|-----------------|--------|
| **A: AI Mindfulness** (Recommended) | "Think before using AI" | Only tool in this space | Greenfield, growing |
| **B: Distraction Blocker** | "Block sites with accountability" | Better analytics | Crowded, commoditized |

**Recommendation:** Path A. AI mindfulness is differentiated; distraction blocking is table stakes.

---

## Priority 1: Identity Crisis (Critical)

**Problem:** Name says "Creativity Guard," tagline promises two things, default tab is blocking but AI feature is the differentiator.

**Solution:**
1. Survey users: which feature do they value?
2. Choose Path A or B based on data
3. Reorganize popup: primary feature first, secondary in "Advanced"
4. Update manifest description to single value prop

**Success:** 90%+ users articulate what extension does in one sentence.

---

## Priority 2: Onboarding (High)

**Problem:** No guidance on install. Users get 3 tabs with no context.

**Solution:**
1. Welcome page on first install asking "What brings you here?"
2. Configure primary feature based on answer
3. Tooltips on first popup open
4. Progressive disclosure: reveal secondary features after week 1

**Success:** 60%+ day-1 retention, 80%+ enable at least one feature during onboarding.

---

## Priority 3: Level Up Primary Feature (High)

### If Path A (AI Mindfulness):

**Current problems:**
- "Alpha" label, hidden in tab 2
- Generic prompts, no behavior change loop
- Wrong framing ("don't use AI" vs "use AI better")

**Improvements:**
- Reframe: "Better AI Questions" not "Think First"
- Context-aware prompts (coding vs writing vs research)
- Inline scratch pad for preparation notes
- Progressive unlock: full modal → quick reminder → expert mode
- Usage insights: "You skip preparation on Friday afternoons"

### If Path B (Distraction Blocker):

**Current problems:**
- Feature parity with Freedom, Cold Turkey, StayFocusd
- No accountability beyond bypass tracking

**Improvements:**
- Reflection prompts using user's own past reasons
- Longer countdown (60s, not 5s)
- Public commitment integration
- Cross-device sync (requires backend)

---

## Priority 4: Distribution

After product is focused:
1. Chrome Web Store listing (screenshots, description, privacy policy)
2. Landing page with clear value prop
3. Product Hunt launch

---

## Lower Priority (Build When Needed)

| Item | Why Defer |
|------|-----------|
| Monetization | Need PMF first |
| Firefox/Safari/Mobile | Scale concern, not core |
| A/B Testing | Need user base first |
| Advanced analytics | Build when measuring something specific |

---

## Key Risks

1. **AI companies block extension** → Focus on browser-level interception
2. **Users don't value "think first"** → Validate with research before committing
3. **Competitors copy** → Move fast, build community moat

---

## Next Action

Make the Path A/B decision. Everything else follows from this.
