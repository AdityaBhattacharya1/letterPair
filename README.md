<img src="./public/hero-2.png" />

<h1 style="text-align: center;">Letter Pair</h1>

## 🖋️ Overview

Letter Pair is a tool that evaluates and compares two font files, extracting key metrics such as x-height, cap-height, stroke contrast, and average character width. It then calculates a compatibility score to help designers and typographers determine how well two fonts pair together.

## 🚀 Features

-   📏 Compare various fonts and determine a compatibility score between the two
-   🎨 Analyzes stroke contrast to determine visual consistency
-   🧮 Computes a compatibility score based on font properties
-   📂 Simple and Intuitive UI

# **Methodology**

This algorithm evaluates font compatibility by analyzing key typographic characteristics and computing a compatibility score. It employs **stroke contrast analysis**, **x-height comparison**, **character width measurements**, and a **feature vector approach** that quantifies font attributes into numerical representations.

---

## **1. Stroke Contrast Analysis**

Stroke contrast refers to the variation in thickness between different parts of a character's strokes. This feature helps distinguish fonts with thick-thin transitions (e.g., Didone serifs) from those with uniform strokes (e.g., geometric sans-serifs).

### **SVG Path Extraction**

-   Fonts are converted to SVG paths using `text-to-svg`.
-   Characters are rendered at a large size (300px) for higher accuracy.
-   The SVG path commands are parsed to extract stroke geometry.

### **Stroke Segment Identification**

-   The algorithm processes path commands (M, L, C, Q) to extract stroke data.
-   For each stroke segment, it calculates:
    -   The **distance** between points (potential stroke width).
    -   The **angle** of the segment (to classify direction).

### **Segment Filtering**

-   Segments are filtered based on length:
    -   **Minimum length:** 3% of font size (eliminates tiny artifacts).
    -   **Maximum length:** 50% of font size (prevents outline misinterpretations).
-   Segments are classified as:
    -   **Horizontal:** ±20° from 0° or 180°.
    -   **Vertical:** ±20° from 90°.
    -   **Diagonal strokes are ignored** to prevent skewed measurements.

### **Contrast Calculation**

-   The algorithm computes a **trimmed mean** for horizontal and vertical stroke widths.
-   The contrast ratio is derived from:
    ```
    stroke_contrast = thicker_stroke_width / thinner_stroke_width
    ```
-   To prevent extreme values, the contrast is **capped at 10:1** (a reasonable maximum for most fonts).
-   Multiple contrast-sensitive characters are analyzed ('O', 'H', 'B', 'o', 'e', 'g', 'D', 'G', 'Q', 'p', 'q'), and their average contrast ratio is taken.

---

## **2. Other Typographic Metrics**

### **x-Height**

-   Measured using the lowercase **"x"**.
-   Normalized by dividing by the font size.
-   Reflects the height of lowercase letters without ascenders/descenders.

### **Cap Height**

-   Measured using the uppercase **"H"**.
-   Normalized by dividing by the font size.
-   Represents the height of capital letters.

### **Average Character Width**

-   Calculated using the width of the lowercase alphabet.
-   Normalized by dividing by the font size.
-   Provides a measure of a font's overall proportions.

---

## **3. Feature Vector Representation & Distance Calculation**

Every font is represented as a **feature vector**, a numerical representation of key attributes. This allows fonts to be compared using mathematical distance calculations.

### **Feature Vector Definition**

Each font is described as a multi-dimensional vector:

```
Font Vector = [xHeight, capHeight, strokeContrast, avgCharWidth, serif, geometric, aperture]
```

Where:

-   **xHeight**: Normalized height of "x".
-   **capHeight**: Normalized height of "H".
-   **strokeContrast**: Average thick-to-thin stroke ratio.
-   **avgCharWidth**: Average width of lowercase letters.
-   **serif (0-1)**: 0 = sans-serif, 1 = serif.
-   **geometric (1-10)**: 1 = humanist, 10 = geometric.
-   **aperture (1-10)**: 1 = closed, 10 = open.

### **Euclidean Distance Calculation**

The similarity between two fonts is computed using **Euclidean distance**:

```
distance = √[(f1A - f1B)² + (f2A - f2B)² + ... + (fnA - fnB)²]
```

Where **lower values** indicate **greater similarity**.

For **complementary pairings**, the goal is:

-   **Low distance** in x-height, width, and weight (ensures cohesion).
-   **High distance** in contrast, serif style, and geometry (creates contrast).

---

## **4. Compatibility Score Calculation**

A final **compatibility score (0-1)** is derived from a weighted combination of **feature similarity** and **Euclidean distance**:

```
score = (1 - normalized_distance) * weight_factor
```

-   **Higher score** (closer to 1) = More compatible fonts.
-   **Lower score** (closer to 0) = Less compatible fonts.

The algorithm balances **cohesive elements** (x-height, width) with **contrasting features** (serif vs. sans-serif, stroke contrast) to determine **both similarity and complementary potential**.

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
