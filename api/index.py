from flask import Flask, request, jsonify
from fontTools.ttLib import TTFont
import numpy as np
import math
from io import BytesIO

app = Flask(__name__)

FEATURE_WEIGHTS = {
    "X_HEIGHT": 0.0652,
    "STROKE_CONTRAST": 0.3841,
    "AVG_CHAR_WIDTH": 0.2101,
    "FEATURE_DISTANCE": 0.3406,
}


def analyze_font(font_buffer):
    font = TTFont(BytesIO(font_buffer))
    cmap = font.getBestCmap()

    hmtx = font["hmtx"]
    head = font["head"]
    os2 = font.get("OS/2")

    units_per_em = head.unitsPerEm

    char_x = cmap.get(ord("x"))
    char_X = cmap.get(ord("X"))

    x_height = 0
    cap_height = 0

    if char_x and char_X and "glyf" in font:
        try:
            glyf = font["glyf"]
            g_x = glyf[char_x]
            g_X = glyf[char_X]

            if hasattr(g_x, "yMax") and hasattr(g_X, "yMax"):
                x_height = g_x.yMax - g_x.yMin
                cap_height = g_X.yMax - g_X.yMin
        except:
            pass

    x_height_ratio = x_height / cap_height if cap_height else 0

    widths = []
    for char in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789":
        glyph_name = cmap.get(ord(char))
        if glyph_name:
            advance = hmtx[glyph_name][0]
            widths.append(advance)

    avg_width = np.mean(widths) if widths else 0
    min_width = np.min(widths) if widths else 0
    max_width = np.max(widths) if widths else 0
    width_range = (max_width - min_width) / avg_width if avg_width > 0 else 0

    contrast_chars = [
        "O",
        "H",
        "B",
        "o",
        "e",
        "g",
        "D",
        "G",
        "Q",
        "p",
        "q",
        "n",
        "m",
        "h",
        "b",
        "d",
    ]
    stroke_contrast_values = []

    for char in contrast_chars:
        try:
            glyph_name = cmap.get(ord(char))
            if glyph_name and "glyf" in font:
                glyf = font["glyf"]
                glyph = glyf[glyph_name]

                if hasattr(glyph, "coordinates") and len(glyph.coordinates) > 0:
                    coords = np.array(glyph.coordinates)

                    if len(coords) >= 4:
                        all_widths = []

                        for i in range(len(coords) - 1):
                            dx = abs(coords[i + 1][0] - coords[i][0])
                            dy = abs(coords[i + 1][1] - coords[i][1])

                            if dx > 0:
                                all_widths.append(dx)
                            if dy > 0:
                                all_widths.append(dy)

                        if len(all_widths) >= 4:
                            sorted_widths = sorted(all_widths)

                            q1_idx = int(len(sorted_widths) * 0.25)
                            q3_idx = int(len(sorted_widths) * 0.75)

                            q1 = sorted_widths[q1_idx]
                            q3 = sorted_widths[q3_idx]

                            if q1 > 0 and q1 != q3:
                                ratio = q3 / q1
                                ratio = min(ratio, 10)
                                stroke_contrast_values.append(ratio)
        except:
            pass

    stroke_contrast = None
    if stroke_contrast_values:
        stroke_contrast_values.sort()
        median_index = len(stroke_contrast_values) // 2
        stroke_contrast = stroke_contrast_values[median_index]

    normalized_x_height = x_height / units_per_em
    normalized_cap_height = cap_height / units_per_em
    normalized_avg_width = avg_width / units_per_em

    return {
        "xHeight": float(normalized_x_height),
        "capHeight": float(normalized_cap_height),
        "xHeightRatio": float(x_height_ratio),
        "strokeContrast": (
            float(stroke_contrast) if stroke_contrast is not None else None
        ),
        "avgCharWidth": float(normalized_avg_width),
        "widthRange": float(width_range),
        "unitsPerEm": int(units_per_em),
        "featureVector": [
            float(x_height_ratio),
            float(stroke_contrast) if stroke_contrast is not None else 1.0,
            float(normalized_avg_width),
            float(width_range),
        ],
    }


def calculate_compatibility_score(font_a, font_b):
    x_height_ratio_diff = abs(font_a["xHeightRatio"] - font_b["xHeightRatio"])
    x_height_score = 1 - min(x_height_ratio_diff / 0.1, 1)

    stroke_contrast_score = 0.5
    if font_a["strokeContrast"] is not None and font_b["strokeContrast"] is not None:
        max_contrast = max(font_a["strokeContrast"], font_b["strokeContrast"])
        min_contrast = min(font_a["strokeContrast"], font_b["strokeContrast"])
        stroke_contrast_score = min_contrast / max_contrast

    width_ratio = min(
        font_a["avgCharWidth"] / font_b["avgCharWidth"],
        font_b["avgCharWidth"] / font_a["avgCharWidth"],
    )
    width_score = 1 - abs(width_ratio - 1) / 0.25 if 0.75 <= width_ratio <= 1.25 else 0

    feature_distance_diff = math.sqrt(
        sum(
            (font_a["featureVector"][i] - font_b["featureVector"][i]) ** 2
            for i in range(len(font_a["featureVector"]))
        )
    )
    feature_distance_score = max(0, 1 - feature_distance_diff / 5)

    score = (
        FEATURE_WEIGHTS["X_HEIGHT"] * x_height_score
        + FEATURE_WEIGHTS["STROKE_CONTRAST"] * stroke_contrast_score
        + FEATURE_WEIGHTS["AVG_CHAR_WIDTH"] * width_score
        + FEATURE_WEIGHTS["FEATURE_DISTANCE"] * feature_distance_score
    )

    return score


@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        if "fontA" not in request.files or "fontB" not in request.files:
            return jsonify({"error": "Font A and Font B are required"}), 400

        font_a_file = request.files["fontA"]
        font_b_file = request.files["fontB"]
        font_c_file = request.files.get("fontC")

        font_a_buffer = font_a_file.read()
        font_b_buffer = font_b_file.read()

        font_a_metrics = analyze_font(font_a_buffer)
        font_b_metrics = analyze_font(font_b_buffer)

        if font_c_file:
            font_c_buffer = font_c_file.read()
            font_c_metrics = analyze_font(font_c_buffer)

            compatibility_score_ab = calculate_compatibility_score(
                font_a_metrics, font_b_metrics
            )
            compatibility_score_ac = calculate_compatibility_score(
                font_a_metrics, font_c_metrics
            )
            compatibility_score_bc = calculate_compatibility_score(
                font_b_metrics, font_c_metrics
            )
            overall_score = (
                compatibility_score_ab + compatibility_score_ac + compatibility_score_bc
            ) / 3

            def get_font_point(font):
                return [
                    font["xHeightRatio"],
                    font["avgCharWidth"],
                    (
                        font["strokeContrast"]
                        if font["strokeContrast"] is not None
                        else 1.0
                    ),
                ]

            point_a = get_font_point(font_a_metrics)
            point_b = get_font_point(font_b_metrics)
            point_c = get_font_point(font_c_metrics)

            def vector_subtract(p, q):
                return [p[i] - q[i] for i in range(len(p))]

            def cross_product(u, v):
                return [
                    u[1] * v[2] - u[2] * v[1],
                    u[2] * v[0] - u[0] * v[2],
                    u[0] * v[1] - u[1] * v[0],
                ]

            def vector_length(v):
                return math.sqrt(sum(x**2 for x in v))

            def distance(p, q):
                return math.sqrt(sum((p[i] - q[i]) ** 2 for i in range(len(p))))

            ab = vector_subtract(point_b, point_a)
            ac = vector_subtract(point_c, point_a)
            cross = cross_product(ab, ac)
            triangle_area = 0.5 * vector_length(cross)

            ab_length = distance(point_a, point_b)
            bc_length = distance(point_b, point_c)
            ca_length = distance(point_c, point_a)
            triangle_perimeter = ab_length + bc_length + ca_length

            return jsonify(
                {
                    "fontA": font_a_metrics,
                    "fontB": font_b_metrics,
                    "fontC": font_c_metrics,
                    "compatibilityScores": {
                        "AB": compatibility_score_ab,
                        "AC": compatibility_score_ac,
                        "BC": compatibility_score_bc,
                        "overall": overall_score,
                    },
                    "triangleMethod": {
                        "points": {
                            "A": point_a,
                            "B": point_b,
                            "C": point_c,
                        },
                        "area": triangle_area,
                        "perimeter": triangle_perimeter,
                    },
                }
            )
        else:
            compatibility_score = calculate_compatibility_score(
                font_a_metrics, font_b_metrics
            )

            return jsonify(
                {
                    "fontA": font_a_metrics,
                    "fontB": font_b_metrics,
                    "compatibilityScore": compatibility_score,
                }
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
