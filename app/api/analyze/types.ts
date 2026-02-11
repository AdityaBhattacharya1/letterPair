export interface FontMetrics {
	xHeight: number
	capHeight: number
	xHeightRatio: number
	strokeContrast: number | null
	avgCharWidth: number
	widthRange: number
	unitsPerEm: number
	featureVector: number[]
}

export interface AnalysisResult {
	fontA: FontMetrics
	fontB: FontMetrics
	fontC?: FontMetrics
	compatibilityScore?: number
	compatibilityScores?: {
		AB: number
		AC: number
		BC: number
		overall: number
	}
	triangleMethod?: {
		points: { A: number[]; B: number[]; C: number[] }
		area: number
		perimeter: number
	}
}
