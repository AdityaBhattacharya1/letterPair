import os from 'os'
import path from 'path'
import { execSync } from 'child_process'
import { FontMetrics } from '../types'
import fs from 'fs'
import FEATURE_WEIGHTS from '../weights'

export function writeBufferToTempFile(buffer: Buffer, ext = '.ttf'): string {
	const tempDir = os.tmpdir()
	const tempFileName = `font-${Date.now()}-${Math.random()
		.toString(36)
		.substring(2)}${ext}`
	const tempFilePath = path.join(tempDir, tempFileName)
	fs.writeFileSync(tempFilePath, buffer)
	return tempFilePath
}

export function parseFontMetrics(jsonOutput: string): FontMetrics {
	const lines = jsonOutput.split('\n')

	const metrics: Record<string, number | null> = {
		xHeight: null,
		capHeight: null,
		xHeightRatio: null,
		strokeContrast: null,
		avgCharWidth: null,
		widthRange: null,
		unitsPerEm: null,
	}

	for (const line of lines) {
		if (line.includes('units_per_em:')) {
			const match = line.match(/units_per_em:\s*([\d]+)/)
			if (match) metrics.unitsPerEm = parseInt(match[1])
		}
		if (line.includes('x_height_ratio:')) {
			const match = line.match(/x_height_ratio:\s*([\d.]+)/)
			if (match) metrics.xHeightRatio = parseFloat(match[1])
		}
		if (line.includes('stroke_contrast:')) {
			const match = line.match(/stroke_contrast:\s*([\d.]+)/)
			if (match) metrics.strokeContrast = parseFloat(match[1])
		}
		if (line.includes('avg_advance_width:')) {
			const match = line.match(/avg_advance_width:\s*([\d.]+)/)
			if (match) metrics.avgCharWidth = parseFloat(match[1])
		}
		if (line.includes('x_height:') && !line.includes('x_height_ratio')) {
			const match = line.match(/x_height:\s*([\d]+)/)
			if (match) metrics.xHeight = parseInt(match[1])
		}
		if (line.includes('cap_height:')) {
			const match = line.match(/cap_height:\s*([\d]+)/)
			if (match) metrics.capHeight = parseInt(match[1])
		}
		if (line.includes('width_range_ratio:')) {
			const match = line.match(/width_range_ratio:\s*([\d.]+)/)
			if (match) metrics.widthRange = parseFloat(match[1])
		}
	}

	const upem = metrics.unitsPerEm || 1000

	return {
		xHeight: (metrics.xHeight || 0) / upem,
		capHeight: (metrics.capHeight || 0) / upem,
		xHeightRatio: metrics.xHeightRatio || 0,
		strokeContrast: metrics.strokeContrast,
		avgCharWidth: (metrics.avgCharWidth || 0) / upem,
		widthRange: metrics.widthRange || 0,
		unitsPerEm: upem,
		featureVector: [
			metrics.xHeightRatio || 0,
			metrics.strokeContrast || 1.0,
			(metrics.avgCharWidth || 0) / upem,
			metrics.widthRange || 0,
		],
	}
}

export function analyzeWithFontTools(fontPath: string): FontMetrics {
	const pythonScript = `
import sys
sys.path.insert(0, '/usr/local/lib/python3.11/site-packages')
sys.path.insert(0, '/usr/local/bin')

from fontTools.ttLib import TTFont
import numpy as np
from pathlib import Path

font_path = '${fontPath}'
font = TTFont(font_path)
cmap = font.getBestCmap()

hmtx = font['hmtx']
head = font['head']
os2 = font.get('OS/2')
hhea = font.get('hhea')

units_per_em = head.unitsPerEm

print(f"Font: {Path(font_path).stem}")
print(f"units_per_em: {units_per_em}")

char_x = cmap.get(ord('x'))
char_X = cmap.get(ord('X'))

if char_x and char_X and 'glyf' in font:
    try:
        glyf = font['glyf']
        g_x = glyf[char_x]
        g_X = glyf[char_X]
        
        if hasattr(g_x, 'yMax') and hasattr(g_X, 'yMax'):
            x_height = g_x.yMax - g_x.yMin
            cap_height = g_X.yMax - g_X.yMin
            x_height_ratio = x_height / cap_height if cap_height else 0
            
            print(f"x_height: {x_height}")
            print(f"cap_height: {cap_height}")
            print(f"x_height_ratio: {x_height_ratio:.6f}")
    except Exception as e:
        print(f"Error measuring x-height: {e}")

if os2:
    sx_height = getattr(os2, 'sxHeight', None)
    s_cap_height = getattr(os2, 'sCapHeight', None)
    if sx_height and s_cap_height:
        ratio = sx_height / s_cap_height
        print(f"os2_x_height_ratio: {ratio:.6f}")

widths = []
for char in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789':
    glyph_name = cmap.get(ord(char))
    if glyph_name:
        advance = hmtx[glyph_name][0]
        widths.append(advance)

if widths:
    avg_width = np.mean(widths)
    min_width = np.min(widths)
    max_width = np.max(widths)
    width_range = (max_width - min_width) / avg_width
    
    print(f"avg_advance_width: {avg_width:.2f}")
    print(f"width_range_ratio: {width_range:.6f}")

contrastChars = ['O', 'H', 'B', 'o', 'e', 'g', 'D', 'G', 'Q', 'p', 'q', 'n', 'm', 'h', 'b', 'd']
strokeContrastValues = []

for char in contrastChars:
    try:
        glyph_name = cmap.get(ord(char))
        if glyph_name and 'glyf' in font:
            glyf = font['glyf']
            glyph = glyf[glyph_name]
            
            if hasattr(glyph, 'coordinates') and len(glyph.coordinates) > 0:
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
                            strokeContrastValues.append(ratio)
    except:
        pass

if strokeContrastValues:
    avg_contrast = sum(strokeContrastValues) / len(strokeContrastValues)
    print(f"stroke_contrast: {avg_contrast:.6f}")
else:
    print("stroke_contrast: null")
`

	const pythonFile = path.join(os.tmpdir(), `analyze-${Date.now()}.py`)
	fs.writeFileSync(pythonFile, pythonScript)

	try {
		const output = execSync(`python3 "${pythonFile}"`, {
			encoding: 'utf-8',
			maxBuffer: 10 * 1024 * 1024,
		})

		fs.unlinkSync(pythonFile)

		return parseFontMetrics(output)
	} catch (error) {
		fs.unlinkSync(pythonFile)
		console.error('FontTools analysis failed:', error)
		throw new Error(`Font analysis failed: ${(error as Error).message}`)
	}
}

export function calculateCompatibilityScore(
	fontA: FontMetrics,
	fontB: FontMetrics,
): number {
	const xHeightRatioDiff = Math.abs(fontA.xHeightRatio - fontB.xHeightRatio)
	const xHeightScore = 1 - Math.min(xHeightRatioDiff / 0.1, 1)

	let strokeContrastScore = 0.5
	if (fontA.strokeContrast !== null && fontB.strokeContrast !== null) {
		const maxContrast = Math.max(fontA.strokeContrast, fontB.strokeContrast)
		const minContrast = Math.min(fontA.strokeContrast, fontB.strokeContrast)
		strokeContrastScore = minContrast / maxContrast
	}

	const widthRatio = Math.min(
		fontA.avgCharWidth / fontB.avgCharWidth,
		fontB.avgCharWidth / fontA.avgCharWidth,
	)
	const widthScore =
		widthRatio >= 0.75 && widthRatio <= 1.25
			? 1 - Math.abs(widthRatio - 1) / 0.25
			: 0

	const featureDistanceDiff = Math.sqrt(
		fontA.featureVector.reduce((sum, val, i) => {
			return sum + Math.pow(val - fontB.featureVector[i], 2)
		}, 0),
	)
	const featureDistanceScore = Math.max(0, 1 - featureDistanceDiff / 5)

	const score =
		FEATURE_WEIGHTS.X_HEIGHT * xHeightScore +
		FEATURE_WEIGHTS.STROKE_CONTRAST * strokeContrastScore +
		FEATURE_WEIGHTS.AVG_CHAR_WIDTH * widthScore +
		FEATURE_WEIGHTS.FEATURE_DISTANCE * featureDistanceScore

	return score
}
