import opentype from 'opentype.js'

/**
 * Load a font file and extract key metrics.
 */
export async function analyzeFont(fontPath) {
	const font = await opentype.load(fontPath)

	const xHeight = font.tables.os2.sxHeight || estimateXHeight(font)
	const capHeight = font.tables.os2.sCapHeight || estimateCapHeight(font)
	const strokeContrast = calculateStrokeContrast(font)
	const avgCharWidth = font.tables.hhea.advanceWidthMax / font.numGlyphs

	return { xHeight, capHeight, strokeContrast, avgCharWidth }
}

/**
 * Estimate x-height if not available.
 */
function estimateXHeight(font) {
	const xGlyph = font.charToGlyph('x')
	return xGlyph ? xGlyph.advanceWidth / font.unitsPerEm : 0.5
}

/**
 * Estimate cap-height if not available.
 */
function estimateCapHeight(font) {
	const hGlyph = font.charToGlyph('H')
	return hGlyph ? hGlyph.advanceWidth / font.unitsPerEm : 0.7
}

/**
 * Calculate stroke contrast using glyph vector analysis.
 */
function calculateStrokeContrast(font) {
	const oGlyph = font.charToGlyph('O')
	if (!oGlyph || !oGlyph.path) return 0.5

	let minStroke = Infinity
	let maxStroke = 0

	oGlyph.path.commands.forEach((cmd) => {
		if (cmd.type === 'C' || cmd.type === 'Q') {
			const thickness = Math.abs(cmd.x1 - cmd.x2)
			minStroke = Math.min(minStroke, thickness)
			maxStroke = Math.max(maxStroke, thickness)
		}
	})

	return minStroke / maxStroke
}
