'use client'

import { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import BackgroundPaths from '@/components/kokonutui/background-paths'
import FontUploader from '@/components/font-uploader'
import FontVisualizer from '@/components/font-visualizer'
import FontMetrics from '@/components/font-metrics'
import RecommendedPairs from '@/components/recommended-pairs'
import Link from 'next/link'

export default function AnalyzePage() {
	const [fontA, setFontA] = useState<File | null>(null)
	const [fontB, setFontB] = useState<File | null>(null)
	const [fontAUrl, setFontAUrl] = useState<string | null>(null)
	const [fontBUrl, setFontBUrl] = useState<string | null>(null)
	const [analysisResult, setAnalysisResult] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const recommendationsRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({
		target: recommendationsRef,
		offset: ['start end', 'end start'],
	})

	const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

	const handleFontUpload = (
		file: File,
		setFont: Function,
		setFontUrl: Function
	) => {
		setFont(file)
		setFontUrl(URL.createObjectURL(file))
	}

	const analyzeFonts = async () => {
		if (!fontA || !fontB) {
			setError('Please upload both fonts')
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const formData = new FormData()
			formData.append('fontA', fontA)
			formData.append('fontB', fontB)

			const response = await fetch('/api/analyze', {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) throw new Error('Failed to analyze fonts.')

			const result = await response.json()
			setAnalysisResult(result)

			if (recommendationsRef.current) {
				setTimeout(() => {
					recommendationsRef.current?.scrollIntoView({
						behavior: 'smooth',
					})
				}, 500)
			}
		} catch (err) {
			setError('Failed to analyze fonts. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen">
			<BackgroundPaths title="Letter Pair">
				<div className="max-w-4xl mx-auto">
					<motion.div className="bg-white/90 dark:bg-black/90 rounded-2xl p-6 shadow-xl mt-10">
						<h2 className="text-2xl font-bold my-6 text-center">
							Upload Your Fonts
						</h2>
						<div className="grid md:grid-cols-2 gap-6">
							<FontUploader
								label="Font A"
								onUpload={(file) =>
									handleFontUpload(
										file,
										setFontA,
										setFontAUrl
									)
								}
								fileName={fontA?.name}
							/>
							<FontUploader
								label="Font B"
								onUpload={(file) =>
									handleFontUpload(
										file,
										setFontB,
										setFontBUrl
									)
								}
								fileName={fontB?.name}
							/>
						</div>
						{error && (
							<div className="mt-4 text-red-600">{error}</div>
						)}
						<button
							onClick={analyzeFonts}
							disabled={!fontA || !fontB || isLoading}
							className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl"
						>
							{isLoading
								? 'Analyzing...'
								: 'Analyze Compatibility'}
						</button>
					</motion.div>
					{analysisResult && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.3 }}
							className="mt-12"
						>
							{/* Font Metrics Display */}
							<FontMetrics
								fontA={analysisResult.fontA}
								fontB={analysisResult.fontB}
								compatibilityScore={
									analysisResult.compatibilityScore
								}
								fontAName={fontA?.name || 'Font A'}
								fontBName={fontB?.name || 'Font B'}
							/>

							{/* Font Visualizer Section */}
							<div className="grid md:grid-cols-2 gap-6 mt-8">
								{fontAUrl && (
									<FontVisualizer
										fontUrl={fontAUrl}
										fontName={fontA?.name || 'Font A'}
									/>
								)}
								{fontBUrl && (
									<FontVisualizer
										fontUrl={fontBUrl}
										fontName={fontB?.name || 'Font B'}
									/>
								)}
							</div>
							<motion.div
								ref={recommendationsRef}
								style={{ opacity }}
								className="my-12"
							>
								<RecommendedPairs />
							</motion.div>
						</motion.div>
					)}
				</div>
			</BackgroundPaths>
		</div>
	)
}
