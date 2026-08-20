# Balm

## Design System and Interface Specification, Version 2.1

**Owner:** Atofarati Ltd
**Prepared:** 19 August 2026
**Companion to:** the build specification, version 1.0
**Direction:** warm and human, friendly
**Replaces:** version 1.0, the kraft and ledger direction, which was too cold and too institutional

---

## 1. Balm and Sabi Health

**Balm** is the product. It is the clinic's own tool: the patient form, the dashboard, the alerts, the seal.

**Sabi Health** is the public review site that Balm feeds. It is where an ordinary Nigerian goes to look up a clinic before they visit.

The two names divide the work cleanly. Balm is what a clinic buys and logs into. Sabi Health is what the public sees. They share this design system entirely: same colours, same type, same voice, so anyone who meets both recognises them as one family.

The names carry the two halves of the idea. Balm is what soothes, which is what a clinic is meant to do and what calling an unhappy patient back actually is. Sabi means to know, which is what the public site gives a person who is tired of guessing.

---

## 2. How to use this document

Step one, save this in the repository as `DESIGN.md`, next to `SPEC.md`.

Step two, tell Claude Code to build the token layer in section 12 before any screen.

Step three, hold it to section 11, the list of things it must not do.

Step four, when something changes, change it here first. Do not let the design live only in a chat.

---

## 3. The feeling

Warm, friendly, and calm. Like a well run clinic where the receptionist actually smiles at you. Not clinical, not corporate, not a Silicon Valley startup.

Three things carry that feeling: a soft warm background instead of hard white, a golden yellow that does the greeting, and generous rounded shapes with plenty of space. Everything else stays quiet.

**The one bold move:** the seal. When a patient finishes, a soft golden seal presses onto the screen with the word Received. It is the only animation in the product and the only place the brand shows off. Keep everything around it calm so the seal is the thing people remember.

---

## 4. Colour

Six colours. Nothing outside this list appears in the interface.

| Token | Hex | What it is and where it goes |
|---|---|---|
| `--cocoa` | `#33251E` | All text. A warm dark brown, not black, because black feels cold and clinical. |
| `--milk` | `#FCF5EC` | The main background on every screen, patient and clinic alike. Soft, warm, easy in daylight. |
| `--sand` | `#F3E9DA` | The second surface. Alternate table rows, unselected option blocks, the alert band. |
| `--marigold` | `#F0A63C` | Primary buttons, the logo, the seal, selected states. This is the greeting colour. Always with `--cocoa` text on top, never white text. |
| `--leaf` | `#2F7A5B` | Links, good scores, confirmation messages, the trend line. |
| `--berry` | `#B23A5F` | Alerts and errors only. Never decoration, never a chart colour that is not an alert. |

Supporting values, for lines and quiet text only:

| Token | Hex | Use |
|---|---|---|
| `--rule` | `#E7DACA` | Every divider and border |
| `--muted` | `#7A6A5D` | Helper text, timestamps, secondary labels |
| `--paper` | `#FFFFFF` | Input fields and the publish card only |

Rules on colour:

1. No gradients anywhere.
2. No blue anywhere, including links.
3. Marigold always carries cocoa text. Yellow with white text is unreadable and is the most common way this palette gets ruined.
4. Berry appears only when something is wrong.
5. Score colour follows one scale: 70 and above is `--leaf`, 40 to 69 is `--cocoa`, below 40 is `--berry`.
6. Pure white is a field colour, not a background colour. If a screen starts looking white, it has drifted.

---

## 5. Typography

**Display face: Gabarito.** Friendly, slightly rounded, with real character. Used for question text, page titles, the score numeral, and the wordmark. Weight 600 for headings, 700 for the score numeral. Never below 20px.

**Body and interface face: Public Sans.** Everything else. Buttons, labels, table rows, helper text. Chosen because it stays legible at small sizes on inexpensive Android screens. Weights 400, 500, 600.

**Loading strategy, which is a design constraint here.** The patient form has a 150KB budget. Self host both faces as woff2, subset to Latin basic, Public Sans in 400 and 600, Gabarito in 600 only, with a system sans fallback and metric overrides so nothing jumps when the fonts land.

**Patient screens, mobile first at 360px**

| Role | Size and line height | Face and weight |
|---|---|---|
| Question | 30 / 36 | Gabarito 600 |
| Option label | 18 / 24 | Public Sans 500 |
| Helper text | 14 / 20 | Public Sans 400 |
| Button | 17 / 20 | Public Sans 600 |
| Consent and legal | 13 / 19 | Public Sans 400 |

**Clinic screens**

| Role | Size and line height | Face and weight |
|---|---|---|
| Score numeral | 56 / 52 | Gabarito 700, tabular figures |
| Page title | 22 / 28 | Gabarito 600 |
| Section label | 11 / 14, uppercase, 0.08em tracking | Public Sans 600 |
| Table and body | 14 / 20 | Public Sans 400 |
| Helper and timestamp | 12 / 16 | Public Sans 400 |

Sentence case everywhere. No all caps except the section label.

---

## 6. Space and shape

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Nothing in between.

**Rounded corners, because the direction is friendly.** 14px on blocks, cards and option rows. 10px on buttons and inputs. 999px on small chips. Nothing square.

**One soft shadow, used sparingly.** `0 1px 2px rgba(51, 37, 30, 0.06)`, permitted only on the publish card and the alert band. Everywhere else, separation comes from `--sand` and from 1px `--rule` lines.

Patient screen padding: 24px sides, 32px top, content capped at 520px and centred on wider screens.

---

## 7. The seal

When a patient submits, a seal appears: a marigold circle with a soft scalloped edge, `--cocoa` text inside reading Received, and beneath it the clinic name and date.

Motion: starts at 1.3 scale and zero opacity, settles to 1.0 over 320ms with a firm ease out, then a small 60ms bounce of 2 percent. Once, no loop. Under `prefers-reduced-motion` it appears in its final state with no movement.

The same circle, without the scallop and without motion, is the logo mark and the favicon. It appears in exactly three places: the thank you screen, the logo, and the printed waiting room poster.

---

## 8. Patient screens

No navigation, no footer, no Balm logo at the top. The clinic's own name sits small in `--muted`. In that moment the form belongs to the clinic, not to you.

**Progress.** Four small rounded dots under the clinic name, filling with marigold as each question is answered.

**Welcome screen.** Clinic name, then in Gabarito: How was your visit today? Then: This takes about thirty seconds. Please do not tell us anything about your health condition. Your answers go to the clinic. Button: Start.

**Question screens, one per screen.** Question at 30px with generous space beneath. Options stacked as full width blocks, minimum 64px tall, `--sand` fill, 14px radius, 12px gap between them. Tapping selects and advances after 180ms, no next button. A selected block turns marigold with cocoa text. A quiet Go back link sits at the bottom.

**Comment screen.** White field on milk, 1px `--rule` border, 10px radius, five rows. Character counter appears only after 240 characters. Helper text: please do not include details about your health condition. Two buttons: Send and Skip.

**Optional details screen.** Who attended to you, as a list of names ending with I would rather not say. Then name and phone, both marked optional, with the line: only if you are happy for the clinic to call you. Then an unticked checkbox: the clinic may publish my comment publicly, without my full name.

**Thank you screen.** The seal presses on. Above it, in Gabarito: Thank you. Below it one line. If an alert was triggered: the clinic manager has been told, and someone may call you today. Otherwise: your feedback has gone to the clinic. Nothing else is asked of them.

---

## 9. Clinic screens

**Shell.** Left rail at 220px in `--sand`, collapsing to a bottom bar on mobile. Rail items: Overview, Responses, Alerts, Publish, Team, Links, Settings.

**Overview, in order.**

The alert band, shown only when open alerts exist. `--sand` fill, 3px `--berry` left edge, 14px radius. Heading reads for example: 3 patients need a call back. Each row shows score, time, branch, the first line of the comment, and Call on WhatsApp where a number exists. It sits above everything because it is the only urgent thing in the product.

The score block. The 30 day score as a 56px Gabarito numeral in `--leaf`, section label above reading LAST 30 DAYS, and the change beneath in plain words: up 4 points on the month before. Response count and completion rate beside it, smaller.

The trend. One line in `--leaf`, no fill, no gradient, no grid beyond a single baseline, dots on hover only.

The breakdown. Two tables, by branch and by staff member, side by side on desktop and stacked on mobile. Rounded container in `--milk`, alternate rows tinted `--sand`, numerals tabular and right aligned.

**Responses.** Newest first. Columns: date and time, branch, staff member, score, wait, would return, and the comment truncated to one line. Filters as a plain row of controls above the table. Clicking a row expands it in place, never a modal.

**Alerts.** Open first, resolved below and visually quieter. Resolving needs a note of at least ten characters, and the button stays disabled with the helper text: add a short note about what you did.

**Publish.** Only responses where the patient consented. Each on a white card with the full comment, the score, and two buttons: Publish and Decline. Above the queue: published comments appear on your Sabi Health page. Names are never shown.

**Empty states.** Instructions, never moods. No responses yet reads: no responses yet. Print your QR code and put it at the front desk, with a button reading Get my QR code. No alerts reads: no patients are waiting on a call back. No illustrations.

---

## 10. The public Sabi Health page

Same milk background, so the public side feels like the same product.

Clinic name in Gabarito, the score as a large numeral with the response count beneath in plain words, the branch list, then reviews as simple rounded blocks: score, month and year, and the comment. Display name is a first name or the word Anonymous. Never a full name. Never a staff member's name.

One line at the bottom of every clinic page in `--muted`: every review here comes from a patient who visited this clinic and agreed to publish it.

That sentence is the entire difference between Sabi Health and a comments section. Do not shrink it or remove it.

---

## 11. Do not do these things

1. No blue, anywhere, including links.
2. No white text on marigold.
3. No pure white page backgrounds.
4. No gradients, glass effects, or blurred panels.
5. No stock illustrations, especially smiling doctors or medical icons.
6. No emoji in the interface.
7. No star ratings. The scale is words, because stars invite thoughtless tapping.
8. No chatbot, product tour, or onboarding modal.
9. No Inter, Roboto, Poppins, or Montserrat.
10. No dark mode in version one.
11. No Balm logo on the patient form.
12. No second accent colour. If green is taken, use size or weight, not a new colour.

---

## 12. Paste ready tokens

```css
:root {
  --cocoa: #33251E;
  --milk: #FCF5EC;
  --sand: #F3E9DA;
  --marigold: #F0A63C;
  --leaf: #2F7A5B;
  --berry: #B23A5F;
  --rule: #E7DACA;
  --muted: #7A6A5D;
  --paper: #FFFFFF;

  --radius-block: 14px;
  --radius-control: 10px;
  --radius-chip: 999px;
  --shadow-soft: 0 1px 2px rgba(51, 37, 30, 0.06);

  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-6: 24px; --space-8: 32px;  --space-12: 48px; --space-16: 64px;

  --font-display: "Gabarito", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Public Sans", ui-sans-serif, system-ui, sans-serif;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-fast: 120ms; --dur-screen: 180ms; --dur-seal: 320ms;
}
```

```js
// tailwind.config.js, theme.extend
colors: {
  cocoa: '#33251E', milk: '#FCF5EC', sand: '#F3E9DA',
  marigold: '#F0A63C', leaf: '#2F7A5B', berry: '#B23A5F',
  rule: '#E7DACA', muted: '#7A6A5D',
},
borderRadius: { DEFAULT: '10px', sm: '10px', md: '14px', lg: '14px', xl: '14px', full: '999px' },
fontFamily: {
  display: ['Gabarito', 'system-ui', 'sans-serif'],
  sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
},
```

---

## 13. Quality floor

1. Text and background pairings meet 4.5 to 1, and the large numeral meets 3 to 1.
2. Tap targets 44px minimum, 64px on the patient form.
3. Full keyboard operation with a visible marigold focus ring at 2px offset.
4. Real label elements on every input. A placeholder is never a label.
5. Works at 360px wide and at 200 percent zoom.
6. Legible in direct sunlight, which is why the surface is bright.
7. Reduced motion respected everywhere.
8. No layout shift when fonts load.

---

## 14. Voice

Plain Nigerian English, no slang, sentence case, active verbs. Buttons say what happens: Send, Publish, Resolve, Get my QR code. Never Submit.

An action keeps its name throughout. Publish produces Published. Resolve produces Resolved.

Errors say what happened and what to do. Not: something went wrong. Instead: your answer did not send. Check your connection and tap Send again. Your answers are still here.

Never use the words journey, seamless, empower, or platform in the interface. Never apologise in an error message. Never use an exclamation mark.

---

## 15. The printed poster

A4 and A5, milk background, and it must still work printed in black only on a cheap office printer.

One line in Gabarito at large size: How was your visit today. The QR code at 40mm square minimum. One line beneath: it takes thirty seconds, and the clinic manager reads every response. The seal small at the bottom. Nothing else, and no Balm logo at the top, because the clinic should feel it is their poster.

---

*Colour values, type sizes and component measurements here are prescriptive. Anything not specified should follow the nearest rule that is, rather than being invented.*
