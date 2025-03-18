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
				{ error: 'Font A and Font B are required' },
				{ status: 400 }
			)
		}
		const fontABuffer = await fontAFile.arrayBuffer()
		const fontBBuffer = await fontBFile.arrayBuffer()
		const fontCFile = formData.get('fontC') as File

		if (fontCFile) {
			const fontCBuffer = await fontCFile.arrayBuffer()
			const fontAMetrics = analyzeFont(Buffer.from(fontABuffer))
			const fontBMetrics = analyzeFont(Buffer.from(fontBBuffer))
			const fontCMetrics = analyzeFont(Buffer.from(fontCBuffer))
			const compatibilityScoreAB = calculateCompatibilityScore(
				fontAMetrics,
				fontBMetrics
			)
			const compatibilityScoreAC = calculateCompatibilityScore(
				fontAMetrics,
				fontCMetrics
			)
			const compatibilityScoreBC = calculateCompatibilityScore(
				fontBMetrics,
				fontCMetrics
			)
			const overallScore =
				(compatibilityScoreAB +
					compatibilityScoreAC +
					compatibilityScoreBC) /
				3

			const getFontPoint = (
				font: FontMetrics
			): [number, number, number] => {
				return [
					font.strokeContrast !== null
						? font.strokeContrast / 10
						: 0.1,
					font.avgCharWidth,
					font.xHeight,
				]
			}
			const pointA = getFontPoint(fontAMetrics)
			const pointB = getFontPoint(fontBMetrics)
			const pointC = getFontPoint(fontCMetrics)
			const vectorSubtract = (p: number[], q: number[]): number[] =>
				p.map((v, i) => v - q[i])
			const crossProduct = (u: number[], v: number[]): number[] => [
				u[1] * v[2] - u[2] * v[1],
				u[2] * v[0] - u[0] * v[2],
				u[0] * v[1] - u[1] * v[0],
			]
			const vectorLength = (v: number[]): number =>
				Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
			const AB = vectorSubtract(pointB, pointA)
			const AC = vectorSubtract(pointC, pointA)
			const cross = crossProduct(AB, AC)
			const triangleArea = 0.5 * vectorLength(cross)
			const distance = (p: number[], q: number[]): number =>
				Math.sqrt(
					p.reduce((sum, val, i) => sum + Math.pow(val - q[i], 2), 0)
				)
			const AB_length = distance(pointA, pointB)
			const BC_length = distance(pointB, pointC)
			const CA_length = distance(pointC, pointA)
			const trianglePerimeter = AB_length + BC_length + CA_length

			return NextResponse.json({
				fontA: fontAMetrics,
				fontB: fontBMetrics,
				fontC: fontCMetrics,
				compatibilityScores: {
					AB: compatibilityScoreAB,
					AC: compatibilityScoreAC,
					BC: compatibilityScoreBC,
					overall: overallScore,
				},
				triangleMethod: {
					points: { A: pointA, B: pointB, C: pointC },
					area: triangleArea,
					perimeter: trianglePerimeter,
				},
			})
		} else {
			const fontAMetrics = analyzeFont(Buffer.from(fontABuffer))
			const fontBMetrics = analyzeFont(Buffer.from(fontBBuffer))
			const compatibilityScore = calculateCompatibilityScore(
				fontAMetrics,
				fontBMetrics
			)
			return NextResponse.json({
				fontA: fontAMetrics,
				fontB: fontBMetrics,
				compatibilityScore,
			})
		}
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 }
		)
	}
}

function writeBufferToTempFile(buffer: Buffer, ext = '.ttf'): string {
	const tempDir = os.tmpdir()
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
				case 'M':
					currentPoint = { x: cmd.x, y: cmd.y }
					break
				case 'L':
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const distance = calculateDistance(
							lastPoint,
							currentPoint
						)
						const angle = calculateAngle(lastPoint, currentPoint)
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
				case 'C':
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const controlPoint1 = { x: cmd.x1, y: cmd.y1 }
						const controlPoint2 = { x: cmd.x2, y: cmd.y2 }
						const numSamples = 10
						let prevSamplePoint = lastPoint
						for (let i = 1; i <= numSamples; i++) {
							const t = i / numSamples
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
				case 'Q':
					if (lastPoint) {
						currentPoint = { x: cmd.x, y: cmd.y }
						const controlPoint = { x: cmd.x1, y: cmd.y1 }
						const numSamples = 8
						let prevSamplePoint = lastPoint
						for (let i = 1; i <= numSamples; i++) {
							const t = i / numSamples
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
			const horizontalSegments: StrokeSegment[] = []
			const verticalSegments: StrokeSegment[] = []
			strokeSegments.forEach((segment) => {
				const normalizedAngle = normalizeAngle(segment.angle)
				if (
					normalizedAngle < Math.PI / 9 ||
					normalizedAngle > Math.PI - Math.PI / 9
				) {
					horizontalSegments.push(segment)
				} else if (
					Math.abs(normalizedAngle - Math.PI / 2) <
					Math.PI / 9
				) {
					verticalSegments.push(segment)
				}
			})
			if (horizontalSegments.length < 2 || verticalSegments.length < 2) {
				return null
			}
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
			const getTrimmedMean = (segments: StrokeSegment[]): number => {
				if (segments.length <= 2) return getMedian(segments)
				const sortedSegments = [...segments].sort(
					(a, b) => a.width - b.width
				)
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
			if (horizontalWidth > 0 && verticalWidth > 0) {
				const thickStroke = Math.max(horizontalWidth, verticalWidth)
				const thinStroke = Math.min(horizontalWidth, verticalWidth)
				if (thinStroke > 0) {
					const ratio = thickStroke / thinStroke
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
	const tempFontPath = writeBufferToTempFile(fontBuffer)
	const textToSVG = TextToSVG.loadSync(tempFontPath)
	fs.unlinkSync(tempFontPath)
	const fontSize = 300
	const xMetrics = textToSVG.getMetrics('x', { fontSize })
	const hMetrics = textToSVG.getMetrics('H', { fontSize })
	const xHeight = xMetrics.height / fontSize
	const capHeight = hMetrics.height / fontSize
	const sampleText = 'abcdefghijklmnopqrstuvwxyz'
	const sampleMetrics = textToSVG.getMetrics(sampleText, { fontSize })
	const avgCharWidth = sampleMetrics.width / sampleText.length / fontSize
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
	let strokeContrast: number | null = null
	if (strokeContrastValues.length > 0) {
		strokeContrastValues.sort((a, b) => a - b)
		const median =
			strokeContrastValues[Math.floor(strokeContrastValues.length / 2)]
		const filteredValues = strokeContrastValues.filter(
			(val) => val <= median * 3
		)
		if (filteredValues.length > 0) {
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
	let strokeContrastScore = 0.5
	if (fontA.strokeContrast !== null && fontB.strokeContrast !== null) {
		const maxContrast = Math.max(fontA.strokeContrast, fontB.strokeContrast)
		const minContrast = Math.min(fontA.strokeContrast, fontB.strokeContrast)
		strokeContrastScore = minContrast / maxContrast
	}
	const widthRatio = Math.min(
		fontA.avgCharWidth / fontB.avgCharWidth,
		fontB.avgCharWidth / fontA.avgCharWidth
	)
	const featureDistance = calculateFeatureDistance(
		fontA.featureVector,
		fontB.featureVector
	)
	const featureDistanceScore = Math.max(0, 1 - featureDistance / 10)
	const score =
		0.35 * xHeightRatio +
		0.25 * strokeContrastScore +
		0.2 * widthRatio +
		0.2 * featureDistanceScore
	return score
}
