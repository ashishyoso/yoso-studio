# Fifty+ Carousel Design Guidelines

A regeneration spec for Instagram carousels in the Fifty+ house style. Every token below was extracted from the source PDFs (fonts, hex values, sizes, geometry) and is meant to be used as the single source of truth when you ask me to build a new carousel. If a new instruction conflicts with this file, the new instruction wins, but flag the deviation.

---

## 1. What Fifty+ is, in one line

Science-backed health education for the adult children of aging Indian parents. Every carousel takes one body system or health topic, explains the mechanism in plain language, localises it to India, and ends with a save-and-comment lead magnet. The emotional spine is always: *the body has been changing quietly for decades, the first symptom is often the disease itself, and it can still change.*

**Audience:** the son or daughter, 25 to 45, who worries about a parent. Written in second person about the parent ("your parents", "your mom", "she won't feel it").

**Promise structure:** alarm without panic. State the hidden risk plainly, then hand over a checklist that restores agency.

---

## 2. Canvas and grid

| Property | Value |
|---|---|
| Native artboard | 810 x 1012.5 pt (Instagram 4:5 portrait) |
| Export size | 1080 x 1350 px |
| Outer margin | 48 px (≈ 4.5% of width) on the 1080 canvas |
| Alignment | Everything flush left. No centred body copy ever. |
| Slide count | 8 is the default arc (see Section 8). 7 is acceptable. |

All px values in this document assume the **1080 px** export canvas. To convert a native pt value to px, multiply by 1.333.

---

## 3. Colour system

| Role | Hex | Use |
|---|---|---|
| Background cream | `#F1E8DE` | Every slide background. Never white. |
| Card ivory | `#F2E9DF` | Fill for the check/do panels. One step lighter than the bg. |
| Terracotta (primary) | `#D14124` | Logo pill, section headers, highlight bars, save button, topic words in headlines, stat highlights, citations, arrow bullets. This is the brand. |
| Alarm red | `#D14124` | Reserved for the single most negative phrase in a headline (the loss, the decline, the rupture). Use sparingly, usually once per cover. |
| Ink | `#1A1A1A` | Default headline and body text. |
| Pure black | `#1A1A1A` | Occasionally used interchangeably with ink in body runs. Treat `#1A1A1A` as canonical. |
| White | `#FFFFFF` | Text inside terracotta surfaces (highlight bar, save button), and the nav pill fill. |
| Card shadow | `rgba(208, 64, 36, 0.12)` | Soft warm drop shadow under cards. Never a grey/black shadow. |

**Headline colour logic (do this every time):**
- Default words = ink `#1A1A1A`.
- The topic noun = terracotta `#D14124` (e.g. "sleep after 50", "knees start hurting", "PROTEIN").
- The single worst outcome phrase = alarm red `#D14124` (e.g. "less time in deep sleep", "not getting stronger").
- A headline almost never uses all three colours on one line. Two colours per line maximum.

---

## 4. Typography

Four typefaces, each with a fixed job. Do not mix jobs.

| Role | Original font | Where it is used | Practical web/Google substitute |
|---|---|---|---|
| Display Sans (humanist) | Vera Humana 95 | Cover hook headlines, save-slide statement headlines, "Comment X below" | `Mulish` (closest free humanist), fallback `Hanken Grotesk`, web-safe `Verdana` |
| Display Serif (editorial) | high-contrast serif (Canva-embedded) | Interior section headers, "Here's what to check / helps:" | `Fraunces` (lead), alternates `Source Serif 4`, `Lora`, `PT Serif` |
| Body Sans | Neue Haas Grotesk Display Light (45 Light / 46 Light Italic) | All body copy, bullets, citations, highlight-bar text (italic) | `Inter` Light, web-safe `Helvetica Neue` (it is essentially Helvetica) |
| Handwritten accent | Playwrite US Modern | A few transitional or closing emphasis lines only | `Playwrite US Modern` (available on Google Fonts under that exact name) |

> Note on substitutes: these are the closest accessible matches, not pixel-identical. If exact fidelity matters, license Vera Humana 95 and Neue Haas Grotesk Display and embed them. For most regenerations the substitutes are close enough that the layout, colour, and copy carry the brand.

### Type scale (1080 px canvas)

| Element | Size | Weight / style | Colour | Line height |
|---|---|---|---|---|
| Cover hook headline | 110–117 px | Display Sans, regular | two-tone | 1.02 |
| Save-slide headline | 80–96 px | Display Sans, regular | two-tone | 1.05 |
| Interior section header | 80–84 px | Display Serif | `#D14124` | 1.05 |
| Sub-header ("Here's what helps:") | 50–52 px | Display Serif | `#D14124` | 1.1 |
| Cover subhead | 36–38 px | Body Sans Light | `#1A1A1A` | 1.3 |
| Body copy | 34–36 px | Body Sans Light | `#1A1A1A` (stats `#D14124`) | 1.35 |
| Highlight bar | 32–34 px | Body Sans Light Italic | `#FFFFFF` | 1.2 |
| Check/do list item | 30–31 px | Body Sans Light | `#1A1A1A` | 1.3 |
| Handwritten accent | 36–38 px | Playwrite US Modern | mix of `#1A1A1A` and `#D14124` | 1.25 |
| Citation (in parens) | matches body | Body Sans Light | `#D14124` or `#1A1A1A` | inherit |

Headlines are set tight (line height ~1.0) and large enough to fill most of the slide width. Body copy breaks early and often, roughly one clause per line, with blank lines between thoughts.

---

## 5. Components

### 5.1 Logo pill
- "FIFTY+" wordmark in white Display Sans (bold/heavy weight), inside a terracotta `#D14124` rounded pill (fully rounded ends).
- The "+" is a thin medical-style cross set slightly raised, like a plus/superscript.
- Position: top-left, 48 px margin. On image-left slides it moves to top-right.
- Pill height ≈ 48–52 px.

### 5.2 Highlight bar (the thesis bar)
- A solid terracotta `#D14124` rectangle hugging the left margin, width = its text plus padding.
- Text inside: Body Sans Light **Italic**, white, one line, the single-sentence thesis of the slide (e.g. "Bone is living tissue.", "The immune system has two parts.").
- Sits directly under the section header. Slight corner radius (~2 px) or square.

### 5.3 Arrow bullets
- Glyph "→" in terracotta `#D14124`, hanging to the left of the text with the text block indented so wrapped lines align under the first word, not under the arrow.
- Used in all checklist content.

### 5.4 Check / Do cards
- Two ivory `#FFFAF1` rounded cards (corner radius ~24 px) with the soft warm shadow `rgba(208,64,36,0.12)`.
- Staggered, not aligned: the first card ("Here's what to check:") sits upper and slightly left/full-width; the second ("Here's what helps:") sits lower and slightly right, overlapping the vertical centre. They never sit in a neat side-by-side grid.
- Each card: a serif sub-header in terracotta, then an arrow-bullet list inside.
- This is the signature "what to check, what to do" slide.

### 5.5 Nav pill (advance arrow)
- White rounded pill (fully rounded), black right-pointing arrow centred inside.
- Size ≈ 110 x 56 px. Position: bottom-left on most slides, bottom-right on image-heavy slides. Present on every slide except the final save slide.

### 5.6 Save button
- Terracotta `#D14124` rectangle, small radius (~4 px), white Body Sans **Italic** text "Save This Post".
- Final slide only, lower-left.

### 5.7 Comment mechanic
- A single line: "Comment **KEYWORD** below." with KEYWORD in terracotta caps (SLEEP, KNEE, HEART, IMMUNE, PROTEIN, SMELL, GUIDE).
- Followed by a short offer line: "We will send you a free guide on …".

---

## 6. Imagery system

Four image modes, chosen by topic:

1. **Flat vector mascot** — friendly, rounded, single-subject (sleeping brain, smiling heart, immune shield). Used on covers and save slides for warmth.
2. **Duotone photo** — real photography colour-graded into the brand. Warm red/orange duotone for most topics; cool blue duotone used for the sleep set. Realistic but unmistakably on-brand.
3. **Scientific / anatomical illustration** — semi-realistic medical art (knee joint, spine, blood vessels, thymus, bone microstructure). Used on mechanism and "what changes" slides.
4. **3D render** — glossy 3D objects (heart, stomach, vitamin capsule) for a premium editorial accent.

**Placement rules:**
- Photos bleed off the bottom and/or right edge. The corner facing into the layout gets a large radius (~32–40 px); a few save slides use an angled/rotated crop.
- Never centre an image with even margins. It always anchors to an edge so text owns the top-left.
- One dominant image per slide. Text and image do not overlap; text occupies the upper-left, image the lower or right.

---

## 7. Voice and copy rules

- Second person, about the parent. "Your parents", "your mom", "she won't feel it."
- Short declarative sentences. One idea per line. Frequent paragraph breaks.
- Open with a provocative question or a counterintuitive stat. Close with an aphorism: "The event is not sudden. Only the discovery is." / "Dal feeds the meal. Whey fills the gap the meal leaves behind."
- Always restore agency near the end: "It can still change." / "Both are fixable."
- Anchor every topic to India: dal, milk, paneer, squatting, floor sitting, and Indian data sources (ICMR, LASI, Delhi NCR studies, Indian Journal of Rheumatology, Apollo, Indian Heart Association).
- Cite real sources in parentheses, format: `(First author et al., Journal, Year, n=…)`. Highlight the headline number in terracotta or red.
- Never prescribe drugs or doses. Frame supplements as "if reports show deficiency, as advised by a clinician." Keep medical claims to what the cited study supports.

**Em-dash note:** the existing carousels use em dashes inside citations (e.g. "PMC — Aging and Synovial Joint Function"). That conflicts with the no-em-dash house rule. Recommendation: switch citation separators to a comma or en dash going forward so the brand matches your writing standard. Flagging rather than silently changing.

---

## 8. The 8-slide narrative arc (regeneration backbone)

This sequence is the product. Reuse it for any new topic.

1. **Cover / Hook.** Provocative question or stat. Pattern A: "Why do Indian parents [problem] after 50?" Pattern B: "What happens to [system] after 50." Subhead: "Here is [the science / what's happening] and what [still helps / to do]." Mascot or hero image bottom-right. Nav pill.
2. **How [system] actually works.** Plain-language mechanism. Serif header + terracotta highlight bar with the one-line truth + body with key terms in terracotta.
3. **What changes after 50.** The decline, with one cited stat. Highlight bar carries the headline stat.
4. **Why this happens.** Root cause (hormone, cell, organ). The "nobody talks about" angle works well here.
5. **The Indian picture.** India-specific prevalence with citation. Signature recurring slide. Duotone photo, bottom bleed.
6. **Consequences / numbers.** "What poor [X] does to the body" or "What this means in numbers." Risk framing with 2–3 cited stats.
7. **What to check, what to do.** The two-card layout. Check list (signals to watch / tests to get) + Helps list (actions). Arrow bullets.
8. **Save This Post.** Aphoristic statement headline (two-tone Display Sans): "The [X] your parents have today is the [X] they built over 50 years. It can still change." + "Comment KEYWORD below." + free-guide offer + Save button + image.

Not every topic needs all eight; collapse 3+4 or 5+6 if the topic is thin, but always keep 1 (hook), 7 (check/do), and 8 (save).

---

## 9. Build kit (drop-in CSS + slide skeletons)

To regenerate, I produce 8 HTML slides at 1080 x 1350 and export each to PNG, then assemble into a carousel PDF. The tokens below encode everything above.

### 9.1 Design tokens

```css
:root{
  --bg:#F1E8DE;
  --card:#F1E8DE;
  --terracotta:#D14124;
  --alarm:#D14124;
  --ink:#1A1A1A;
  --white:#FFFFFF;
  --shadow:0 12px 40px rgba(208,64,36,0.12);

  --font-display:"Mulish","Hanken Grotesk",Verdana,sans-serif;       /* Vera Humana 95 substitute */
  --font-serif:"Fraunces","Source Serif 4","PT Serif",serif;          /* editorial serif substitute */
  --font-body:"Inter","Helvetica Neue",Arial,sans-serif;              /* Neue Haas Grotesk substitute */
  --font-hand:"Playwrite US Modern",cursive;

  --margin:48px;
}
.slide{
  width:1080px;height:1350px;background:var(--bg);
  position:relative;padding:var(--margin);box-sizing:border-box;
  font-family:var(--font-body);color:var(--ink);overflow:hidden;
}
.logo{display:inline-flex;align-items:center;gap:4px;background:var(--terracotta);
  color:#fff;font-family:var(--font-display);font-weight:800;font-size:30px;
  padding:10px 22px;border-radius:999px;letter-spacing:.5px;}
.h-cover{font-family:var(--font-display);font-size:115px;line-height:1.02;font-weight:400;margin:24px 0;}
.h-section{font-family:var(--font-serif);font-size:82px;line-height:1.05;color:var(--terracotta);font-weight:500;}
.subhead{font-family:var(--font-body);font-weight:300;font-size:37px;line-height:1.3;}
.body{font-family:var(--font-body);font-weight:300;font-size:35px;line-height:1.35;}
.t{color:var(--terracotta);}   /* topic / stat highlight */
.r{color:var(--alarm);}        /* worst-outcome highlight */
.thesis{display:inline-block;background:var(--terracotta);color:#fff;font-style:italic;
  font-weight:300;font-size:33px;padding:10px 18px;}
.card{background:var(--card);border-radius:24px;box-shadow:var(--shadow);padding:36px 40px;}
.card h3{font-family:var(--font-serif);color:var(--terracotta);font-size:51px;margin:0 0 18px;font-weight:500;}
.list{list-style:none;margin:0;padding:0;font-size:31px;line-height:1.3;}
.list li{position:relative;padding-left:42px;margin-bottom:14px;}
.list li::before{content:"→";position:absolute;left:0;color:var(--terracotta);}
.nav{position:absolute;bottom:var(--margin);left:var(--margin);width:110px;height:56px;
  background:#fff;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:34px;}
.save-btn{display:inline-block;background:var(--terracotta);color:#fff;font-style:italic;
  font-size:34px;padding:14px 24px;border-radius:4px;}
.hand{font-family:var(--font-hand);font-size:37px;line-height:1.25;}
.hero{position:absolute;bottom:0;right:0;max-width:62%;border-top-left-radius:36px;}
```

### 9.2 Cover slide skeleton

```html
<div class="slide">
  <span class="logo">FIFTY+</span>
  <h1 class="h-cover">What happens to <span class="t">sleep after 50</span>.
  The body spends more time in bed and <span class="r">less time in deep sleep</span>.</h1>
  <p class="subhead">The answer is not how long they sleep.<br>
  Here is the science and what still helps.</p>
  <img class="hero" src="mascot.png">
  <div class="nav">→</div>
</div>
```

### 9.3 Mechanism / "what changes" slide skeleton

```html
<div class="slide">
  <span class="logo">FIFTY+</span>
  <h2 class="h-section">How sleep actually works</h2>
  <p class="thesis">Sleep is not one uniform state.</p>
  <p class="body" style="margin-top:32px">
    It cycles through stages every <span class="t">90 minutes</span>.<br><br>
    Deep sleep and REM are the two stages that actually restore.<br>
    After 50, the balance shifts toward light sleep.
  </p>
  <div class="nav">→</div>
</div>
```

### 9.4 Check / Do slide skeleton

```html
<div class="slide">
  <span class="logo">FIFTY+</span>
  <h2 class="h-section">What to check, what to do</h2>
  <div class="card" style="width:78%;margin-top:30px">
    <h3>Here's what to check:</h3>
    <ul class="list">
      <li>Sleep duration, are they getting 7–8 hours?</li>
      <li>Night wakings, more than once is a signal</li>
    </ul>
  </div>
  <div class="card" style="width:78%;margin:40px 0 0 22%;">
    <h3>Here's what helps:</h3>
    <ul class="list">
      <li>Fixed sleep and wake time</li>
      <li>Morning sunlight resets the circadian clock</li>
    </ul>
  </div>
  <div class="nav" style="left:auto;right:48px">→</div>
</div>
```

### 9.5 Save slide skeleton

```html
<div class="slide">
  <span class="logo">FIFTY+</span>
  <h1 class="h-cover" style="font-size:88px">The <span class="t">sleep your parents get</span> tonight
  is not the sleep they <span class="t">got at 35</span>.</h1>
  <p class="body"><span class="t" style="font-weight:600">Comment SLEEP</span> below.</p>
  <p class="body">We will send you a free guide on the right timings, habits,
  and what improves deep sleep after 50.</p>
  <span class="save-btn">Save This Post</span>
  <img class="hero" src="gauge.png">
</div>
```

---

## 10. Regeneration QA checklist

Before exporting, confirm:

- [ ] Background is `#F1E8DE`, never white.
- [ ] Logo pill present, correct corner, white wordmark.
- [ ] Every interior header is the serif in terracotta; every cover/save headline is the display sans, two-tone.
- [ ] Alarm red used at most once per slide, on the worst-outcome phrase only.
- [ ] All copy flush left, one idea per line, generous breaks.
- [ ] Every body stat highlighted in terracotta; every citation in parentheses with a real source.
- [ ] India anchoring present on at least the hook and the "Indian picture" slide.
- [ ] Check/do cards are staggered (not a clean grid), ivory fill, warm shadow, arrow bullets.
- [ ] Nav pill on slides 1–7, absent on slide 8; save button on slide 8.
- [ ] Final slide carries the "it can still change" reassurance and the comment-keyword mechanic.
- [ ] Image bleeds off an edge with a rounded inner corner; text never overlaps it.
- [ ] No em dashes in citations (house rule), unless explicitly overridden.

---

## 11. Topic backlog patterns

The set so far covers: sleep, knees/osteoarthritis, heart attacks, immunity, dal vs whey protein, gut microbiome, bone density/menopause, blood vessels, taste and smell. Any future topic should fit the same "one organ or system, mechanism to India to checklist" mould. Strong untapped candidates in the same vein: eyesight and cataracts, kidney function, hearing loss, blood sugar and prediabetes, balance and falls, liver, prostate, muscle loss and sarcopenia, oral and gum health, skin and wound healing.
