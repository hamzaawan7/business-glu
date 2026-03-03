# Business Glu — Brand Guidelines

> These guidelines ensure everyone at Business Glu — team, marketers, and partners — uses the brand with consistency and confidence.

---

## Table of Contents

1. [What is Business Glu?](#what-is-business-glu)
2. [Brand Voice](#brand-voice)
3. [Content Strategy](#content-strategy)
4. [Brand Colors](#brand-colors)
5. [Typography](#typography)
6. [Logo Usage](#logo-usage)

---

## What is Business Glu?

Business Glu is a powerful sales application for teams with big ambitions.

With Business Glu you can train and communicate with your team in one place, in your team's web and mobile app. Ditch the reliance on ever-changing social media platforms and get your own team app.

**Business Glu holds everything together for your leadership and team: training, communication, accountability.**

### Key Value Propositions

| Feature | Description |
|---------|-------------|
| **Training 24/7** | Load & view training for your team and leadership around the clock |
| **Push Notifications** | Communicate with your team via push notifications that get seen |
| **Leads & Tasks** | Access your leads, tasks, and notes instantly on your smartphone |
| **Call Logging** | Take notes, log calls, and set statuses for leads for easy follow-up |
| **Quick Replies** | Start new calls, emails, and texts in just one click |

---

## Brand Voice

### Character / Persona

| Trait | |
|-------|---|
| Casual | ✅ |
| Friendly | ✅ |
| Confident | ✅ |
| Motivating | ✅ |
| Authoritative | ✅ |
| Snarky | ✅ |

### Language

| Trait | |
|-------|---|
| Simple | ✅ |
| Fun | ✅ |
| Technical | ✅ |
| Marketing-rich | ✅ |
| Savvy | ✅ |
| Sales-centric | ✅ |

### Tone

| Trait | |
|-------|---|
| Direct | ✅ |
| Positive | ✅ |
| Playful | ✅ |
| Encouraging | ✅ |
| Honest | ✅ |
| Human vs Robot | ✅ |

### Purpose

| Goal | |
|------|---|
| Educate | ✅ |
| Provide a Solution | ✅ |
| Empower | ✅ |
| Sell | ✅ |
| Fix a Problem | ✅ |
| Help Leaders | ✅ |

---

## Content Strategy

> We help our customers grow and scale their teams using better technology with the Business Glu web and mobile app.

### Audience Interests → Our Response

| What Customers Want | How We Appeal | Where It Lives |
|---------------------|---------------|----------------|
| Growing their sales team | Video tutorials of how to use the tool | Facebook |
| Learning a better way to train | Provide a solution to a common problem | Instagram |
| Leadership | Give them access to their own team app | YouTube |
| Driving sales | Marketing for sales and growth | Their company sites |
| Making money | | Live Events |
| Getting more customers, growing their team | | |

---

## Brand Colors

### Primary Palette

| Color | Hex | Usage | Swatch |
|-------|-----|-------|--------|
| **Dark Slate** | `#495B67` | 40% — Primary brand color, headings, primary UI elements | ![#495B67](https://via.placeholder.com/20/495B67/495B67) |
| **Charcoal** | `#515151` | 30% — Body text, secondary UI elements | ![#515151](https://via.placeholder.com/20/515151/515151) |
| **Steel Blue** | `#71858E` | 20% — Accents, borders, secondary elements, dividers | ![#71858E](https://via.placeholder.com/20/71858E/71858E) |
| **White** | `#FFFFFF` | 10% — Backgrounds, cards, negative space | ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF) |

### Usage Distribution

```
#495B67 ██████████████████████████████████████████  40%  (Primary)
#515151 ██████████████████████████████             30%  (Secondary)
#71858E ████████████████████                       20%  (Accent)
#FFFFFF ██████████                                 10%  (Background)
```

### CSS Variables

```css
:root {
  /* Brand Colors */
  --color-primary:    #495B67;   /* Dark Slate — 40% usage */
  --color-secondary:  #515151;   /* Charcoal — 30% usage */
  --color-accent:     #71858E;   /* Steel Blue — 20% usage */
  --color-background: #FFFFFF;   /* White — 10% usage */
}
```

### Tailwind Config (for future reference)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand': {
          primary:   '#495B67',  // Dark Slate
          secondary: '#515151',  // Charcoal
          accent:    '#71858E',  // Steel Blue
          white:     '#FFFFFF',  // White
        },
      },
    },
  },
};
```

---

## Typography

### Font Families

| Role | Font | Weight | Size |
|------|------|--------|------|
| **Headings** | Montserrat | Bold (700) | 55px |
| **Sub-headings** | Lato | Regular (400) | 30px |
| **Body text** | Lato | Regular (400) | 18px |

### Font Loading (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Montserrat:wght@500;700&display=swap" rel="stylesheet">
```

### CSS Implementation

```css
/* Typography */
h1, h2, h3 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: #495B67;
}

h1 { font-size: 55px; }
h2 { font-size: 42px; }
h3 { font-size: 30px; }

h4, h5, h6 {
  font-family: 'Lato', sans-serif;
  font-weight: 400;
  font-size: 30px;
  color: #515151;
}

body, p, li, td {
  font-family: 'Lato', sans-serif;
  font-weight: 400;
  font-size: 18px;
  color: #515151;
}
```

### Hierarchy Example

> # This Is An Example Of Our Headline
> *Montserrat Bold, 55px, #495B67*
>
> ## This is an example of our subheadline.
> *Lato Regular, 30px, #515151*
>
> This is an example of our body text.
> *Lato Regular, 18px, #515151*

---

## Logo Usage

### Approved Variants

| Variant | Use When |
|---------|----------|
| **Full Color (Light Background)** | Default — use on white or light surfaces |
| **Full Color (Dark Background)** | Use on dark surfaces (#495B67, dark images) |
| **Black & White** | Use in monochrome contexts (print, fax, single-color media) |

### Clear Space

The logo must always have adequate breathing room. **No text or graphic elements** should be placed within the minimum clear-space zone around the logo.

### ❌ Not Allowed

| Rule | Description |
|------|-------------|
| No orientation changes | Do not rotate or flip the logo |
| No additional effects | Do not add shadows, glows, or color overlays |
| No color changes | Do not alter the logo's original colors |
| No element removal | Do not remove or rearrange parts of the logo |
| No rotation | Do not rotate the icon or logotype |
| No stretching | Do not distort or change the aspect ratio |
| No typography changes | Do not add, remove, or change any text in the logo |

---

> **Source:** Business Glu Brand Guidelines PDF — Last updated and documented March 2026.
