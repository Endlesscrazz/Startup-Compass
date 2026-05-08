# Claude Design Prompts — Founder's Navigator UI
# Startup Compass · AI Builder Day 2026
# ─────────────────────────────────────────────────────────────────
#
# HOW TO USE THIS FILE
# Copy each prompt block into claude.ai → New conversation → paste prompt.
# Claude will generate a live React preview in the Artifacts panel.
# Iterate visually there, then copy the final JSX into the project.
#
# ORDER: Run Prompt 1 first (quiz), then Prompt 2 (results).
# Keep the same chat thread for Prompt 2 so Claude remembers the design language.
#
# WHAT SHREYAS OWNS: Everything after the main team landing page.
# Entry point: user has just clicked "Are you a founder?" on the main site.
# They land on /quiz — that is where our design starts.
# ─────────────────────────────────────────────────────────────────


## CONTEXT (read this before copying any prompt — do NOT paste this part)

Parent site: startup.utah.gov — a Utah state government website.
Design language of parent site: clean, institutional, trustworthy.
NOT a startup landing page. NOT colorful or playful. Professional.

Our tool (Founder's Navigator) lives inside that site context.
It should feel like a well-designed government service — like GOV.UK or
USDS-style design — not like a SaaS product or a consumer app.

Color palette (Utah state):
  Primary red:    #CC0000  (Utah state red — use for primary buttons, accents)
  Primary navy:   #003087  (Utah state navy — use for headings, active states)
  Background:     #F7F7F7  (light gray — page background)
  Card white:     #FFFFFF
  Border:         #E2E2E2
  Text primary:   #1A1A1A
  Text muted:     #6B7280
  Success green:  #16A34A  (for Funding badge)
  Info blue:      #2563EB  (for Community badge)
  Orange:         #EA580C  (for Growth badge)
  Teal:           #0D9488  (for International badge)
  Indigo:         #4F46E5  (for Start a Business badge)

Typography: Inter or system-ui. Clean, readable. No decorative fonts.
Components: shadcn/ui. Tailwind CSS. React (Next.js App Router, client component).
No animations beyond simple CSS transitions. No framer-motion.

The user has already clicked "Are you a founder?" on the main team landing page.
They arrive at /quiz with no prior context loaded.


─────────────────────────────────────────────────────────────────
## PROMPT 1 — THE 4-STEP FOUNDER QUIZ
─────────────────────────────────────────────────────────────────

Copy everything between the === START === and === END === markers.

=== START PROMPT 1 ===

Design a 4-step intake quiz for a Utah state government tool called "Founder's Navigator" that helps startup founders find relevant state resources. The user has just clicked "Are you a founder?" on the main site and landed here.

CONTEXT AND TONE:
- This lives inside startup.utah.gov, a Utah state government website
- Design language: GOV.UK / USDS style — clean, institutional, trustworthy, not a SaaS product
- Colors: primary red #CC0000, navy #003087, background #F7F7F7, white cards, border #E2E2E2
- Font: Inter or system-ui. No decorative fonts.
- Components: shadcn/ui Card, Button, Badge, Progress. Tailwind CSS.
- No animations beyond simple CSS opacity/translate transitions

LAYOUT:
- Max width: 640px, centered on page
- White card (rounded-xl, shadow-sm, border border-gray-200) contains each step
- Outside the card at top: step counter ("Step 2 of 4") + linear progress bar (utah-red fill)
- Outside the card at bottom: Back link (text only, muted) on left. Continue button on right.
- Continue button: utah-red (#CC0000) background, white text, disabled until option selected
- Page background: #F7F7F7

STEP 1 — BUSINESS STAGE
Question: "Where is your business right now?"
Subtext: "Be honest — there are no wrong answers."
Options (full-width tappable cards, single select, stacked vertically, 4 options):
  Option 1: 💡 "Just an idea"         — subtext: "I haven't started yet"
  Option 2: 🔨 "Building it out"      — subtext: "Working on it, no revenue yet"
  Option 3: 📈 "Getting traction"     — subtext: "I have paying customers"
  Option 4: 🏢 "Established business" — subtext: "Running and growing"

Option card design:
  - Unselected: white bg, gray border, emoji + bold label + muted subtext
  - Selected: navy border (#003087) 2px, navy left accent bar, light navy bg (#EEF2FF)
  - Hover: very subtle gray bg shift
  - Transition: 150ms ease

STEP 2 — SECTOR
Question: "What sector is your business in?"
Subtext: "Pick the closest match."
Options (same card style, single select, 7 options in a 2-column grid on wider screens, stacked on mobile):
  🖥️ Tech / SaaS          🧬 Life Sciences
  🏭 Manufacturing         🌾 Agriculture
  🚀 Aerospace & Defense   🛍️ Retail / CPG
  🔮 Other

STEP 3 — LOCATION
Question: "Where are you located in Utah?"
Subtext: "Type your city or county name."
Design:
  - Single text input, full width, large (h-12), rounded-lg
  - Placeholder: "e.g. Salt Lake City, Provo, Ogden..."
  - Below input: as user types, show a county resolution hint:
      "→ We'll match you with Salt Lake County resources"
      Style: small text, muted gray, left-aligned below input, appears after 300ms debounce
  - If county can't be resolved: show a fallback "Select your county" dropdown
      listing all 29 Utah counties alphabetically
  - No submit on Enter — user must click Continue

STEP 4 — GOAL + COMMUNITY TAGS
Question: "What are you looking for right now?"
Subtext: "Choose your main goal. Community tags are optional but help us find better matches."

Section A — Primary goal (single select, same option card style, 5 options):
  💰 "Funding"                    — subtext: "Grants, loans, or investment"
  🤝 "Mentorship & community"     — subtext: "Advisors, networks, peer groups"
  🏢 "Workspace"                  — subtext: "Coworking, studio, or maker space"
  📊 "Scaling my business"        — subtext: "Growth resources for established businesses"
  🌍 "Going international"        — subtext: "Export, trade, global markets"

Section B — Community tags (below the goal options, optional, multi-select):
  Label: "Optional: Do any of these apply to you?"
  4 pill-style checkboxes in a row (wrap on mobile):
    🎖️ Veteran-owned    👩 Woman-owned    🌄 Rural business    🎓 University student
  Style: unselected = white bg, gray border, muted text
         selected   = navy bg (#003087), white text, white checkmark icon

LOADING STATE (shown after step 4 submit, replacing the card):
  3-step animated sequence. Each step appears and completes before the next:
  Step A: spinner icon + "Analyzing your profile..."          (0.5s)
  Step B: search icon + "Searching 213 Utah resources..."    (0.8s)
  Step C: sparkle icon + "Generating personalized matches..."  (until API returns)
  
  Style: centered, large icon (48px), text below, muted progress dots
  Background: same white card, same container

NAVIGATION:
  - Step 1: no Back button. "Get Started →" as the Continue button label.
  - Steps 2-4: "← Back" text link on left.
  - Step 4 submit: "Find My Resources →" as the Continue button label.
  - Progress bar fills left to right as steps advance.

Show me a complete working React component for the full 4-step quiz with useState 
managing step and selections. Use Tailwind CSS classes throughout.
Include all 4 steps plus the loading state.
Use shadcn/ui Card and Button components (import from "@/components/ui/card" etc).
The component should be self-contained and visually complete.

=== END PROMPT 1 ===


─────────────────────────────────────────────────────────────────
## PROMPT 2 — RESULTS PAGE
─────────────────────────────────────────────────────────────────

Run this in the SAME claude.ai chat after Prompt 1.
This way Claude already knows the color palette, tone, and component style.

=== START PROMPT 2 ===

Now design the results page that appears after the quiz. Keep the same design 
language, colors, and component style from the quiz above.

WHAT THE PAGE RECEIVES:
The quiz answers are stored in sessionStorage as a JSON object.
The API has returned an array of 5–8 matched resources, each with:
  - resource.title: string         (resource name)
  - resource.link: string          (external URL)
  - resource.description: string   (full description, may be long)
  - resource.topics: string[]      (["Funding", "Start a Business", etc.])
  - resource.communities: string[] (["Veteran", "Women", "Rural", "Student", "Any"])
  - resource.email: string         (contact email, may be empty)
  - score: number                  (0–1 float, our confidence score)
  - explanation: string            (25-word personalized LLM explanation — THE HERO CONTENT)

PAGE LAYOUT:
Max width: 800px, centered. Background: #F7F7F7.

TOP BAR (above result cards):
  Left: "← Start over" text link (goes back to /quiz, clears session)
  Right: "Share results" icon button (copies current URL)
  Below that: a "Based on your profile" summary pill row:
    Shows the user's answers as small gray chips:
    e.g.  [Just an idea]  [Tech / SaaS]  [Salt Lake County]  [Funding]  [Veteran-owned]
    Style: rounded-full, bg-gray-100, text-gray-600, text-sm, gap-2, flex-wrap

RESULT CARDS (one per resource, stacked vertically, gap-4):
  Each card is a white rounded-xl with shadow-sm, border border-gray-200.
  Card has a left accent bar (4px wide, full height) colored by primary topic badge color.

  CARD LAYOUT (inside, padding p-5):
  
  Row 1 — Header:
    Left: Rank number (1, 2, 3...) in a small circle — navy bg (#003087), white text, 28px
    Center: Resource title as a clickable link (opens new tab, text-lg font-semibold text-gray-900, hover:text-[#CC0000])
    Right: 1–2 topic badge pills (see badge colors below)

  Row 2 — Explanation (THE HERO):
    Full width. The LLM-generated personalized explanation.
    Style: text-base, text-gray-800, font-medium, italic, leading-relaxed
    Left border: 3px solid utah-red (#CC0000), pl-3
    This is the most important content — make it visually prominent.

  Row 3 — Description (collapsed):
    Show only 2 lines of resource.description by default.
    "Show more" link in utah-red at end of truncation.
    Toggle on click to show full description.
    Style: text-sm text-gray-600

  Row 4 — Footer (if email exists):
    Small envelope icon + email address, muted, text-xs

TOPIC BADGE COLORS (used in card header right and left accent bar):
  "Funding"                      → bg-green-100  text-green-800  accent #16A34A
  "Entrepreneurship Communities" → bg-blue-100   text-blue-800   accent #2563EB
  "Start a Business"             → bg-indigo-100 text-indigo-800 accent #4F46E5
  "Late Stage Growth"            → bg-orange-100 text-orange-800 accent #EA580C
  "International Trade"          → bg-teal-100   text-teal-800   accent #0D9488
  "Other" / fallback             → bg-gray-100   text-gray-700   accent #6B7280

"HOW WE MATCHED YOU" SECTION (collapsible accordion, below all cards):
  Collapsed by default. Chevron icon toggles it.
  Header text: "How we matched you" (text-sm, font-medium, text-gray-500)
  Expanded content (bg-gray-50, rounded-lg, p-4, text-sm text-gray-600):
    Line 1: "Your profile:" followed by the profileString in a monospace code block
    Line 2: "We compared your profile across 213 Utah resources using semantic search,
             filtered by location eligibility, then generated a personalized explanation
             for each match."
  This section is for judges and technical reviewers — keep it low-profile.

EMPTY STATE (if API returns 0 results after location filter):
  Centered, muted illustration placeholder, text:
  "We couldn't find resources specifically for your county."
  Subtext: "Try searching statewide — many programs serve all of Utah."
  Button: "Search statewide →" (re-runs query without location filter)

SAMPLE DATA to render (use this exact data for the mock):
[
  {
    resource: {
      title: "Utah Microloan Fund (UMLF)",
      link: "https://www.utahmicroloan.org",
      description: "The Utah Microloan Fund provides small business loans from $500 to $50,000 to entrepreneurs who may not qualify for traditional bank financing, with a focus on underserved communities including women, veterans, and rural business owners.",
      topics: ["Funding", "Start a Business"],
      communities: ["Rural", "Women", "Veteran"],
      email: "info@utahmicroloan.org"
    },
    score: 0.94,
    explanation: "As a veteran-owned manufacturing business in Weber County, UMLF specifically targets underserved entrepreneurs who need startup capital outside traditional banking."
  },
  {
    resource: {
      title: "Utah MEP",
      link: "https://www.utahmep.org",
      description: "Utah MEP (Manufacturing Extension Partnership) helps Utah manufacturers improve competitiveness through workforce training, process improvement, and technology adoption support.",
      topics: ["Late Stage Growth", "Entrepreneurship Communities"],
      communities: ["Any"],
      email: ""
    },
    score: 0.91,
    explanation: "Utah MEP is the go-to resource for manufacturing businesses in Weber County — they offer hands-on process improvement and workforce training programs."
  },
  {
    resource: {
      title: "Veteran Business Resource Center (VBRC) Utah",
      link: "https://www.vbrcutah.org",
      description: "The Veteran Business Resource Center provides veteran entrepreneurs with business consulting, mentorship, access to capital, and connections to veteran-friendly procurement opportunities throughout Utah.",
      topics: ["Start a Business", "Entrepreneurship Communities"],
      communities: ["Veteran"],
      email: "contact@vbrcutah.org"
    },
    score: 0.89,
    explanation: "VBRC is built for veteran founders like you — business consulting, capital connections, and procurement pathways across all of Utah."
  },
  {
    resource: {
      title: "iMpact Utah",
      link: "https://www.impactutah.org",
      description: "iMpact Utah connects small business owners with experienced mentors and peer networks, helping entrepreneurs at all stages navigate growth challenges and build lasting business relationships.",
      topics: ["Entrepreneurship Communities", "Late Stage Growth"],
      communities: ["Any"],
      email: ""
    },
    score: 0.86,
    explanation: "iMpact Utah's mentor network is strong in Weber County — ideal for connecting with experienced manufacturing and industrial business owners."
  },
  {
    resource: {
      title: "Small Business Development Center (SBDC)",
      link: "https://www.utahsbdc.org",
      description: "The SBDC provides free, confidential business advising, training, and resources to help Utah entrepreneurs start, grow, and succeed in business.",
      topics: ["Start a Business", "Funding", "Late Stage Growth"],
      communities: ["Rural", "Women", "Veteran", "Student"],
      email: "info@utahsbdc.org"
    },
    score: 0.83,
    explanation: "SBDC offers free business advising statewide — a strong first call for any Weber County founder navigating early-stage manufacturing setup."
  }
]

Show me the complete results page as a React component.
Render all 5 cards from the sample data above.
Include the "Based on your profile" chips (use: idea stage, Manufacturing, Weber County, Start a Business, Veteran-owned).
Include the collapsible "How we matched you" section (collapsed by default).
Use useState for the "show more" toggles and the accordion.
Tailwind CSS throughout. shadcn/ui components where appropriate.
The component should be visually complete and ready to screenshot for a demo.

=== END PROMPT 2 ===


─────────────────────────────────────────────────────────────────
## PROMPT 3 — LOADING STATE (optional, only if Prompt 1 loading state needs refinement)
─────────────────────────────────────────────────────────────────

Run in the SAME chat if the loading state from Prompt 1 needs to be a separate component.

=== START PROMPT 3 ===

From the quiz we built, extract and refine the loading state into a standalone component.

The loading state appears inside the same white card container as the quiz steps.
It replaces the quiz card after the user clicks "Find My Resources →" on step 4.

3-stage animated sequence:
  Stage 1: Magnifier/search icon (48px) + "Analyzing your profile..."
  Stage 2: Database/grid icon (48px) + "Searching 213 Utah resources..."
  Stage 3: Sparkle/stars icon (48px) + "Generating personalized matches..."

Each stage:
  - Icon: centered, 48px, utah-navy (#003087) color
  - Text: centered below icon, text-lg, text-gray-700, font-medium
  - Small animated progress dots below text (3 dots, staggered opacity pulse)
  - Transition to next stage: fade out current, fade in next

Timing:
  - Stage 1 → 2: after 600ms
  - Stage 2 → 3: after 900ms
  - Stage 3: stays until API responds (no fixed timeout)

Overall container:
  - Same white card (max-w-640px, rounded-xl, shadow-sm)
  - Vertically centered content within ~300px height
  - Subtle gray progress bar at top of card (animates from 0% to 80% during stages 1-2, then pulses)

Use only CSS animations (no framer-motion). Tailwind + React useState/useEffect for timing.
Show me the self-contained component.

=== END PROMPT 3 ===


─────────────────────────────────────────────────────────────────
## AFTER GETTING DESIGNS FROM CLAUDE ARTIFACTS

Once you have the React components from claude.ai:

1. Copy the JSX into the correct files:
     Quiz component    → app/quiz/page.tsx
     Results component → app/results/page.tsx
     Loading state     → components/LoadingState.tsx (imported by quiz page)

2. Replace hardcoded sample data with real data sources:
     Quiz: connect useState to actual POST /api/match call
     Results: read from sessionStorage instead of inline mock data
     Loading: trigger when form submits, hide when API responds

3. Replace import paths for shadcn components to match project structure:
     "@/components/ui/card" etc. — these should already match if shadcn is installed

4. Wire real county resolution:
     Step 3 typed input → import { resolveCounty } from "@/lib/counties"
     Show county suggestion below input in real time

5. Wire community tag values to API field names:
     "Veteran-owned"     → "Veteran"
     "Woman-owned"       → "Women"
     "Rural business"    → "Rural"
     "University student"→ "Student"

6. Run: npm run dev → verify each screen renders without errors

─────────────────────────────────────────────────────────────────
## DESIGN DECISIONS LOCKED (do not ask Claude Artifacts to change these)

- 4 steps only. No adding a 5th step.
- No chat interface. Quiz cards only.
- Hard location filter means some resources won't show — do not add a "no filter" toggle.
- Results count: 5–8 cards. Do not add pagination.
- LLM explanation is the hero content on each card — it must be visually dominant.
- The "How we matched you" section must be collapsed by default — it's for judges, not users.
- Utah state colors only (#CC0000, #003087) — no other brand colors.
- Mobile must be readable (single column). Desktop can be 2-col for sector grid only.
