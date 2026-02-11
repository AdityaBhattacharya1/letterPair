import { NextResponse } from 'next/server'
import fs from 'fs'
import { AnalysisResult, FontMetrics } from './types'
import {
	analyzeWithFontTools,
	calculateCompatibilityScore,
	writeBufferToTempFile,
} from './utils/util'

export const runtime = 'nodejs'

export async function POST(
	req: Request,
): Promise<NextResponse<AnalysisResult | { error: string }>> {
	try {
		const formData = await req.formData()
		const fontAFile = formData.get('fontA') as File
		const fontBFile = formData.get('fontB') as File

		if (!fontAFile || !fontBFile) {
			return NextResponse.json(
				{ error: 'Font A and Font B are required' },
				{ status: 400 },
			)
		}

		const fontABuffer = Buffer.from(await fontAFile.arrayBuffer())
		const fontBBuffer = Buffer.from(await fontBFile.arrayBuffer())

		const fontAPath = writeBufferToTempFile(fontABuffer)
		const fontBPath = writeBufferToTempFile(fontBBuffer)

		const fontAMetrics = analyzeWithFontTools(fontAPath)
		const fontBMetrics = analyzeWithFontTools(fontBPath)

		fs.unlinkSync(fontAPath)
		fs.unlinkSync(fontBPath)

		const fontCFile = formData.get('fontC') as File

		if (fontCFile) {
			const fontCBuffer = Buffer.from(await fontCFile.arrayBuffer())
			const fontCPath = writeBufferToTempFile(fontCBuffer)

			const fontCMetrics = analyzeWithFontTools(fontCPath)

			fs.unlinkSync(fontCPath)

			const compatibilityScoreAB = calculateCompatibilityScore(
				fontAMetrics,
				fontBMetrics,
			)
			const compatibilityScoreAC = calculateCompatibilityScore(
				fontAMetrics,
				fontCMetrics,
			)
			const compatibilityScoreBC = calculateCompatibilityScore(
				fontBMetrics,
				fontCMetrics,
			)
			const overallScore =
				(compatibilityScoreAB +
					compatibilityScoreAC +
					compatibilityScoreBC) /
				3

			const getFontPoint = (font: FontMetrics): number[] => [
				font.xHeightRatio,
				font.avgCharWidth,
				font.strokeContrast ?? 0.5,
			]

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

			const distance = (p: number[], q: number[]): number =>
				Math.sqrt(
					p.reduce((sum, val, i) => sum + Math.pow(val - q[i], 2), 0),
				)

			const AB = vectorSubtract(pointB, pointA)
			const AC = vectorSubtract(pointC, pointA)
			const cross = crossProduct(AB, AC)
			const triangleArea = 0.5 * vectorLength(cross)

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
			const compatibilityScore = calculateCompatibilityScore(
				fontAMetrics,
				fontBMetrics,
			)

			return NextResponse.json({
				fontA: fontAMetrics,
				fontB: fontBMetrics,
				compatibilityScore,
			})
		}
	} catch (error) {
		console.error('Error:', error)
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 500 },
		)
	}
}
