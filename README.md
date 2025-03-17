<img src="./public/hero-2.png" />

<h1 style="text-align: center;">Letter Pair</h1>

## 🖋️ Overview

Letter Pair is a tool that evaluates and compares two font files, extracting key metrics such as x-height, cap-height, stroke contrast, and average character width. It then calculates a compatibility score to help designers and typographers determine how well two fonts pair together.

## 🚀 Features

-   📏 Compare various fonts and determine a compatibility score between the two
-   🎨 Analyzes stroke contrast to determine visual consistency
-   🧮 Computes a compatibility score based on font properties
-   📂 Simple and Intuitive UI

## Methodology

The code analyzes font characteristics to determine compatibility between different fonts using several typographic metrics. Here's an explanation of the methodology:

## 1. Stroke Contrast Analysis

Stroke contrast is a fundamental characteristic of typefaces that refers to the variation in thickness between different parts of a character's strokes. Here's how it's calculated:

### SVG Path Extraction

-   The font is converted to SVG paths using the `text-to-svg` library
-   Characters are rendered at a large size (300px) for better accuracy
-   The SVG path commands are parsed to extract geometric information

### Stroke Segment Identification

-   The algorithm walks through SVG path commands (M, L, C, Q)
-   For each segment, it calculates:
    -   The distance between points (potential stroke width)
    -   The angle of the segment (to classify direction)

### Segment Filtering

-   Segments are filtered by length:
    -   Minimum length: 3% of font size (filters out tiny segments)
    -   Maximum length: 50% of font size (prevents outline traversals being counted as strokes)
-   Segments are categorized by angle:
    -   Horizontal: within ±20° of horizontal (0° or 180°)
    -   Vertical: within ±20° of vertical (90°)
    -   Diagonal segments are excluded as they can confuse contrast measurements

### Contrast Calculation

-   For each direction (horizontal and vertical):
    -   A trimmed mean is calculated to avoid outliers
    -   The algorithm removes segments with extreme values
-   The contrast ratio is calculated as:
    -   `thicker_stroke_width / thinner_stroke_width`
-   The result is capped at 10:1 (reasonable maximum for most fonts)

The algorithm uses multiple characters known for showing stroke contrast ('O', 'H', 'B', 'o', 'e', 'g', 'D', 'G', 'Q', 'p', 'q') and takes the average of their individual contrast measurements.

## 2. Other Typographic Metrics

### x-Height

-   Measured using the lowercase 'x' character
-   Normalized by dividing by the font size
-   Represents the height of lowercase letters without ascenders or descenders

### Cap Height

-   Measured using the uppercase 'H' character
-   Normalized by dividing by the font size
-   Represents the height of capital letters

### Average Character Width

-   Calculated by measuring the width of the entire lowercase alphabet
-   Divided by the number of characters (26)
-   Normalized by dividing by the font size

## 3. Compatibility Score Calculation

The compatibility score between two fonts is calculated using a weighted formula:

```
score = 0.35 * xHeightRatio + 0.25 * strokeContrastScore + 0.2 * widthRatio
```

Where:

-   **xHeightRatio**: How similar the x-heights are between fonts (1 - |fontA.xHeight/fontB.xHeight - 1|)
-   **strokeContrastScore**: How similar the stroke contrasts are (minContrast/maxContrast)
-   **widthRatio**: How similar the average character widths are (min/max)

The weights (0.4, 0.35, 0.25) reflect the relative importance of each factor in font pairing:

-   x-Height similarity is most important (40%)
-   Stroke contrast similarity is next (35%)
-   Width similarity is least important but still significant (25%)

This weighted approach balances these key typographic characteristics to produce a single compatibility score between 0 and 1, where higher values indicate greater compatibility.

## 📦 Tech Stack

-   **Framework:** Next.js
-   **Language:** TypeScript

## 🔧 Setup & Installation

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/AdityaBhattacharya1/letterPair
cd font-compatibility-analyzer
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Run the Development Server

```sh
npm run dev
```
