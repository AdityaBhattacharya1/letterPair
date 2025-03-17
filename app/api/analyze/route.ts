import { NextResponse } from 'next/server'
import TextToSVG from 'text-to-svg'
import parseSVG from 'svg-path-parser'
import fs from 'fs'
import os from 'os'
import path from 'path'

interface FontMetrics {
	xHeight: number
	capHeight: number
	strokeContrast: number | null
	avgCharWidth: number
	featureVector: number[]
}

interface Point {
	x: number
	y: number
}

interface StrokeSegment {
	width: number
	angle: number
}

export async function POST(req: Request) {
	try {
		const formData = await req.formData()
		const fontAFile = formData.get('fontA') as File
		const fontBFile = formData.get('fontB') as File

		if (!fontAFile || !fontBFile) {
			return NextResponse.json(
				{ error: 'Both font files are required' },
				{ status: 400 }
			)
		}

		const fontABuffer = await fontAFile.arrayBuffer()
		const fontBBuffer = await fontBFile.arrayBuffer()

		const fontAMetrics = analyzeFont(Buffer.from(fontABuffer))
		const fontBMetrics = analyzeFont(Buffer.from(fontBBuffer))
		const featureDistance = calculateFeatureDistance(
			fontAMetrics.featureVector,
			fontBMetrics.featureVector
		)

		const compatibilityScore = calculateCompatibilityScore(
			fontAMetrics,
			fontBMetrics
		)

		return NextResponse.json({
			fontA: fontAMetrics,
			fontB: fontBMetrics,
			compatibilityScore,
		})
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 }
		)
	}
}

function writeBufferToTempFile(buffer: Buffer, ext = '.ttf'): string {
	const tempDir = os.tmpdir()
	// Create a unique file name
	const tempFileName = `font-${Date.now()}-${Math.random()
		.toString(36)
		.substring(2)}${ext}`
	const tempFilePath = path.join(tempDir, tempFileName)
	fs.writeFileSync(tempFilePath, buffer)
	return tempFilePath
}

function calculateAngle(p1: Point, p2: Point): number {
	return Math.atan2(p2.y - p1.y, p2.x - p1.x)
}

function calculateDistance(p1: Point, p2: Point): number {
	const dx = p2.x - p1.x
	const dy = p2.y - p1.y
	return Math.sqrt(dx * dx + dy * dy)
}

function normalizeAngle(angle: number): number {
	const positiveAngle = angle < 0 ? angle + Math.PI * 2 : angle
	return positiveAngle % Math.PI
}

function calculateFeatureDistance(
	vectorA: number[],
	vectorB: number[]
): number {
	if (vectorA.length !== vectorB.length) return Infinity

	const sumOfSquares = vectorA.reduce((sum, value, index) => {
		return sum + Math.pow(value - vectorB[index], 2)
	}, 0)

	return Math.sqrt(sumOfSquares)
}

function analyzeCharacterStrokeContrast(
	textToSVG: TextToSVG,
	char: string,
	fontSize: number
): number | null {
	try {
		const d = textToSVG.getD(char, { x: 0, y: 0, fontSize })

		const commands = parseSVG.parseSVG(d)

		const strokeSegments: StrokeSegment[] = []
		let lastPoint: Point | null = null

		const minSegmentLength = fontSize * 0.03
		const maxSegmentLength = fontSize * 0.5

		for (const cmd of commands) {
			let currentPoint: Point | null = null

			switch (cmd.code) {
				case 'M': // Move to
					currentPoint = { x: cmd.x, y: cmd.y }
					break

				case 'L': // Line to
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const distance = calculateDistance(
							lastPoint,
							currentPoint
						)
						const angle = calculateAngle(lastPoint, currentPoint)

						// Only consider segments of reasonable length
						if (
							distance >= minSegmentLength &&
							distance <= maxSegmentLength
						) {
							strokeSegments.push({
								width: distance,
								angle: angle,
							})
						}
					}
					break

				case 'C': // Cubic Bezier curve
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const controlPoint1 = { x: cmd.x1, y: cmd.y1 }
						const controlPoint2 = { x: cmd.x2, y: cmd.y2 }

						// Sample points along the curve
						const numSamples = 10
						let prevSamplePoint = lastPoint

						for (let i = 1; i <= numSamples; i++) {
							const t = i / numSamples

							// Cubic Bezier formula
							const sampleX =
								Math.pow(1 - t, 3) * lastPoint.x +
								3 * Math.pow(1 - t, 2) * t * controlPoint1.x +
								3 * (1 - t) * Math.pow(t, 2) * controlPoint2.x +
								Math.pow(t, 3) * currentPoint.x

							const sampleY =
								Math.pow(1 - t, 3) * lastPoint.y +
								3 * Math.pow(1 - t, 2) * t * controlPoint1.y +
								3 * (1 - t) * Math.pow(t, 2) * controlPoint2.y +
								Math.pow(t, 3) * currentPoint.y

							const samplePoint = { x: sampleX, y: sampleY }
							const distance = calculateDistance(
								prevSamplePoint,
								samplePoint
							)
							const angle = calculateAngle(
								prevSamplePoint,
								samplePoint
							)

							// Only add segments of reasonable length
							if (
								distance >= minSegmentLength &&
								distance <= maxSegmentLength
							) {
								strokeSegments.push({
									width: distance,
									angle: angle,
								})
							}

							prevSamplePoint = samplePoint
						}
					}
					break

				case 'Q': // Quadratic Bezier curve
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const controlPoint = { x: cmd.x1, y: cmd.y1 }

						// Sample points along the curve
						const numSamples = 8
						let prevSamplePoint = lastPoint

						for (let i = 1; i <= numSamples; i++) {
							const t = i / numSamples

							// Quadratic Bezier formula
							const sampleX =
								Math.pow(1 - t, 2) * lastPoint.x +
								2 * (1 - t) * t * controlPoint.x +
								Math.pow(t, 2) * currentPoint.x

							const sampleY =
								Math.pow(1 - t, 2) * lastPoint.y +
								2 * (1 - t) * t * controlPoint.y +
								Math.pow(t, 2) * currentPoint.y

							const samplePoint = { x: sampleX, y: sampleY }
							const distance = calculateDistance(
								prevSamplePoint,
								samplePoint
							)
							const angle = calculateAngle(
								prevSamplePoint,
								samplePoint
							)

							// Only add segments of reasonable length
							if (
								distance >= minSegmentLength &&
								distance <= maxSegmentLength
							) {
								strokeSegments.push({
									width: distance,
									angle: angle,
								})
							}

							prevSamplePoint = samplePoint
						}
					}
					break
			}

			if (currentPoint) {
				lastPoint = currentPoint
			}
		}

		if (strokeSegments.length > 0) {
			// Improved angle classification - use more precise angle ranges
			const horizontalSegments: StrokeSegment[] = []
			const verticalSegments: StrokeSegment[] = []

			// Use more precise angle classification
			strokeSegments.forEach((segment) => {
				const normalizedAngle = normalizeAngle(segment.angle)

				// Horizontal: within 20° of 0° or 180°
				if (
					normalizedAngle < Math.PI / 9 ||
					normalizedAngle > Math.PI - Math.PI / 9
				) {
					horizontalSegments.push(segment)
				}
				// Vertical: within 20° of 90°
				else if (
					Math.abs(normalizedAngle - Math.PI / 2) <
					Math.PI / 9
				) {
					verticalSegments.push(segment)
				}
				// Ignore diagonal strokes for contrast calculation
			})

			// If we don't have enough segments in either direction, return null
			if (horizontalSegments.length < 2 || verticalSegments.length < 2) {
				return null
			}

			// Calculate median stroke width for each direction
			const getMedian = (segments: StrokeSegment[]): number => {
				if (segments.length === 0) return 0
				const sortedSegments = [...segments].sort(
					(a, b) => a.width - b.width
				)
				const mid = Math.floor(sortedSegments.length / 2)
				return sortedSegments.length % 2 === 0
					? (sortedSegments[mid - 1].width +
							sortedSegments[mid].width) /
							2
					: sortedSegments[mid].width
			}

			// Use trimmed mean instead of median to avoid outliers
			const getTrimmedMean = (segments: StrokeSegment[]): number => {
				if (segments.length <= 2) return getMedian(segments)

				const sortedSegments = [...segments].sort(
					(a, b) => a.width - b.width
				)
				// Trim 20% from both ends
				const trimAmount = Math.floor(sortedSegments.length * 0.2)
				const trimmedSegments = sortedSegments.slice(
					trimAmount,
					sortedSegments.length - trimAmount
				)

				const sum = trimmedSegments.reduce(
					(acc, seg) => acc + seg.width,
					0
				)
				return sum / trimmedSegments.length
			}

			const horizontalWidth = getTrimmedMean(horizontalSegments)
			const verticalWidth = getTrimmedMean(verticalSegments)

			// Calculate contrast ratio with bounds
			if (horizontalWidth > 0 && verticalWidth > 0) {
				// Ensure we're always dividing larger by smaller
				const thickStroke = Math.max(horizontalWidth, verticalWidth)
				const thinStroke = Math.min(horizontalWidth, verticalWidth)

				if (thinStroke > 0) {
					// Cap the contrast ratio to prevent extreme values
					const ratio = thickStroke / thinStroke
					// For most fonts, stroke contrast rarely exceeds 10:1
					return Math.min(ratio, 10)
				}
			}
		}

		return null
	} catch (error) {
		console.error(`Error analyzing stroke contrast for '${char}':`, error)
		return null
	}
}

function getFeatureVector(font: FontMetrics): number[] {
	return [
		font.xHeight,
		font.capHeight,
		font.strokeContrast ?? 0,
		font.avgCharWidth,
	]
}

function analyzeFont(fontBuffer: Buffer): FontMetrics {
	// Write the font buffer to a temporary file.
	const tempFontPath = writeBufferToTempFile(fontBuffer)

	// Load the font using text-to-svg by providing the file path.
	const textToSVG = TextToSVG.loadSync(tempFontPath)
	// After loading, remove the temporary file.
	fs.unlinkSync(tempFontPath)

	const fontSize = 300 // Using larger font size for better accuracy

	// Get metrics for lowercase "x" and uppercase "H"
	const xMetrics = textToSVG.getMetrics('x', { fontSize })
	const hMetrics = textToSVG.getMetrics('H', { fontSize })

	// Normalize metrics by fontSize.
	const xHeight = xMetrics.height / fontSize
	const capHeight = hMetrics.height / fontSize

	// Compute average character width from sample text.
	const sampleText = 'abcdefghijklmnopqrstuvwxyz'
	const sampleMetrics = textToSVG.getMetrics(sampleText, { fontSize })
	const avgCharWidth = sampleMetrics.width / sampleText.length / fontSize

	// Use characters known for showing stroke contrast in typography
	// Include more characters for a more accurate reading
	const contrastChars = [
		'O',
		'H',
		'B',
		'o',
		'e',
		'g',
		'D',
		'G',
		'Q',
		'p',
		'q',
	]

	const strokeContrastValues: number[] = []

	for (const char of contrastChars) {
		const contrast = analyzeCharacterStrokeContrast(
			textToSVG,
			char,
			fontSize
		)
		if (contrast !== null) {
			strokeContrastValues.push(contrast)
		}
	}

	// Calculate overall stroke contrast (using trimmed mean to avoid outliers)
	let strokeContrast: number | null = null
	if (strokeContrastValues.length > 0) {
		strokeContrastValues.sort((a, b) => a - b)

		// Remove extreme outliers (values more than 3x the median)
		const median =
			strokeContrastValues[Math.floor(strokeContrastValues.length / 2)]
		const filteredValues = strokeContrastValues.filter(
			(val) => val <= median * 3
		)

		if (filteredValues.length > 0) {
			// Calculate the average of the remaining values
			strokeContrast =
				filteredValues.reduce((sum, val) => sum + val, 0) /
				filteredValues.length
		} else {
			strokeContrast = median
		}
	}
	const featureVector = getFeatureVector({
		xHeight,
		capHeight,
		strokeContrast,
		avgCharWidth,
		featureVector: [],
	})

	return { xHeight, capHeight, strokeContrast, avgCharWidth, featureVector }
}

function calculateCompatibilityScore(
	fontA: FontMetrics,
	fontB: FontMetrics
): number {
	const xHeightRatio = 1 - Math.abs(fontA.xHeight / fontB.xHeight - 1)

	// Better stroke contrast comparison
	let strokeContrastScore = 0.5
	if (fontA.strokeContrast !== null && fontB.strokeContrast !== null) {
		const maxContrast = Math.max(fontA.strokeContrast, fontB.strokeContrast)
		const minContrast = Math.min(fontA.strokeContrast, fontB.strokeContrast)
		strokeContrastScore = minContrast / maxContrast
	}

	// Width ratio comparison
	const widthRatio = Math.min(
		fontA.avgCharWidth / fontB.avgCharWidth,
		fontB.avgCharWidth / fontA.avgCharWidth
	)

	const featureDistance = calculateFeatureDistance(
		fontA.featureVector,
		fontB.featureVector
	)
	const featureDistanceScore = Math.max(0, 1 - featureDistance / 10)

	// Weighted score based on typographic principles
	const score =
		0.35 * xHeightRatio +
		0.25 * strokeContrastScore +
		0.2 * widthRatio +
		0.2 * featureDistanceScore
	return score
}
