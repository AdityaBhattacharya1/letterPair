'use client'

import { motion } from 'framer-motion'

interface FontData {
	strokeContrast: number
	avgCharWidth: number
	xHeight: number
}

interface CompatibilityScores {
	AB: number
	AC: number
	BC: number
	overall: number
}

interface FontMetricsProps {
	fontA: FontData
	fontB: FontData
	fontC?: FontData
	compatibilityScore?: number
	compatibilityScores?: CompatibilityScores
	fontAName: string
	fontBName: string
	fontCName?: string
}

export default function FontMetrics({
	fontA,
	fontB,
	fontC,
	compatibilityScore,
	compatibilityScores,
	fontAName,
	fontBName,
	fontCName,
}: FontMetricsProps) {
	const multiFont = Boolean(fontC)
	const scoreValue = multiFont
		? Number((compatibilityScores?.overall || 0).toFixed(2))
		: compatibilityScore || 0

	const getScoreColor = () => {
		if (scoreValue >= 0.8) return 'text-green-600 dark:text-green-400'
		if (scoreValue >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
		return 'text-red-600 dark:text-red-400'
	}

	const getScoreText = () => {
		if (scoreValue >= 0.8) return 'Excellent Match'
		if (scoreValue >= 0.6) return 'Good Match'
		return 'Poor Match'
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	}

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { duration: 0.5 },
		},
	}

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="bg-white/80 dark:bg-black/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-xl border border-neutral-200 dark:border-neutral-800"
		>
			<motion.div variants={itemVariants} className="text-center mb-8">
				<h3 className="text-2xl md:text-3xl font-bold mb-2">
					Font Compatibility Analysis
				</h3>
				<div className="flex items-center justify-center">
					<div className={`text-5xl font-bold ${getScoreColor()}`}>
						{multiFont
							? Number(
									(compatibilityScores?.overall || 0).toFixed(
										2
									)
							  ) * 100
							: Number((compatibilityScore || 0).toFixed(2)) *
							  100}
						%
					</div>
					<div className="ml-3 text-left">
						<div className={`font-medium ${getScoreColor()}`}>
							{getScoreText()}
						</div>
						<div className="text-sm text-neutral-500 dark:text-neutral-400">
							Compatibility Score
						</div>
					</div>
				</div>
			</motion.div>

			<motion.div
				variants={itemVariants}
				className={
					multiFont
						? 'grid md:grid-cols-3 gap-8'
						: 'grid md:grid-cols-2 gap-8'
				}
			>
				<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
					<h4 className="text-lg font-semibold mb-4">{fontAName}</h4>
					<div className="space-y-4">
						<MetricBar
							label="Stroke Contrast"
							value={fontA.strokeContrast.toFixed(3)}
							maxValue={3}
							color="bg-blue-500"
						/>
						<MetricBar
							label="Average Width"
							value={fontA.avgCharWidth.toFixed(3)}
							maxValue={1}
							color="bg-purple-500"
						/>
						<MetricBar
							label="x-Height"
							value={fontA.xHeight}
							maxValue={2}
							color="bg-teal-500"
						/>
					</div>
				</div>

				<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
					<h4 className="text-lg font-semibold mb-4">{fontBName}</h4>
					<div className="space-y-4">
						<MetricBar
							label="Stroke Contrast"
							value={fontB.strokeContrast.toFixed(3)}
							maxValue={3}
							color="bg-blue-500"
						/>
						<MetricBar
							label="Average Width"
							value={fontB.avgCharWidth.toFixed(3)}
							maxValue={1}
							color="bg-purple-500"
						/>
						<MetricBar
							label="x-Height"
							value={fontB.xHeight}
							maxValue={2}
							color="bg-teal-500"
						/>
					</div>
				</div>

				{multiFont && fontC && (
					<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
						<h4 className="text-lg font-semibold mb-4">
							{fontCName || 'Font C'}
						</h4>
						<div className="space-y-4">
							<MetricBar
								label="Stroke Contrast"
								value={fontC.strokeContrast.toFixed(3)}
								maxValue={3}
								color="bg-blue-500"
							/>
							<MetricBar
								label="Average Width"
								value={fontC.avgCharWidth.toFixed(3)}
								maxValue={1}
								color="bg-purple-500"
							/>
							<MetricBar
								label="x-Height"
								value={fontC.xHeight}
								maxValue={2}
								color="bg-teal-500"
							/>
						</div>
					</div>
				)}
			</motion.div>

			{multiFont && fontC ? (
				<motion.div variants={itemVariants} className="mt-8">
					<h4 className="text-lg font-semibold mb-3">
						Pairwise Compatibility Analysis
					</h4>
					<div className="grid grid-cols-2 gap-4">
						<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
							<h5 className="text-md font-semibold mb-2">
								Font A vs Font B
							</h5>
							<div className="space-y-2">
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Stroke Contrast Diff:{' '}
									</span>
									<span className="font-medium">
										{Math.abs(
											fontA.strokeContrast -
												fontB.strokeContrast
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Width Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontA.avgCharWidth /
											fontB.avgCharWidth
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										x-Height Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontA.xHeight / fontB.xHeight
										).toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
							<h5 className="text-md font-semibold mb-2">
								Font A vs Font C
							</h5>
							<div className="space-y-2">
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Stroke Contrast Diff:{' '}
									</span>
									<span className="font-medium">
										{Math.abs(
											fontA.strokeContrast -
												fontC.strokeContrast
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Width Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontA.avgCharWidth /
											fontC.avgCharWidth
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										x-Height Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontA.xHeight / fontC.xHeight
										).toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
							<h5 className="text-md font-semibold mb-2">
								Font B vs Font C
							</h5>
							<div className="space-y-2">
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Stroke Contrast Diff:{' '}
									</span>
									<span className="font-medium">
										{Math.abs(
											fontB.strokeContrast -
												fontC.strokeContrast
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										Width Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontB.avgCharWidth /
											fontC.avgCharWidth
										).toFixed(2)}
									</span>
								</div>
								<div>
									<span className="text-sm text-neutral-500 dark:text-neutral-400">
										x-Height Ratio:{' '}
									</span>
									<span className="font-medium">
										{(
											fontB.xHeight / fontC.xHeight
										).toFixed(2)}
									</span>
								</div>
							</div>
						</div>
						<div className="col-span-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
							<h5 className="text-md font-semibold mb-2">
								Overall Harmony
							</h5>
							<div className={`font-medium ${getScoreColor()}`}>
								{getScoreText()}
							</div>
						</div>
					</div>
				</motion.div>
			) : (
				<motion.div variants={itemVariants} className="mt-8">
					<h4 className="text-lg font-semibold mb-3">
						Compatibility Analysis
					</h4>
					<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 shadow-sm">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-neutral-500 dark:text-neutral-400">
									Stroke Contrast Difference
								</div>
								<div className="font-medium">
									{Math.abs(
										fontA.strokeContrast -
											fontB.strokeContrast
									).toFixed(2)}
								</div>
							</div>
							<div>
								<div className="text-sm text-neutral-500 dark:text-neutral-400">
									Width Ratio
								</div>
								<div className="font-medium">
									{(
										fontA.avgCharWidth / fontB.avgCharWidth
									).toFixed(2)}
								</div>
							</div>
							<div>
								<div className="text-sm text-neutral-500 dark:text-neutral-400">
									x-Height Ratio
								</div>
								<div className="font-medium">
									{(fontA.xHeight / fontB.xHeight).toFixed(2)}
								</div>
							</div>
							<div>
								<div className="text-sm text-neutral-500 dark:text-neutral-400">
									Overall Harmony
								</div>
								<div
									className={`font-medium ${getScoreColor()}`}
								>
									{getScoreText()}
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</motion.div>
	)
}

interface MetricBarProps {
	label: string
	value: string | number
	maxValue: number
	color: string
}

function MetricBar({ label, value, maxValue, color }: MetricBarProps) {
	const percentage = (Number(value) / maxValue) * 100
	return (
		<div>
			<div className="flex justify-between mb-1">
				<span className="text-sm text-neutral-600 dark:text-neutral-300">
					{label}
				</span>
				<span className="text-sm font-medium">{value}</span>
			</div>
			<div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
				<motion.div
					className={`h-full ${color}`}
					initial={{ width: 0 }}
					animate={{ width: `${percentage}%` }}
					transition={{ duration: 0.8, ease: 'easeOut' }}
				/>
			</div>
		</div>
	)
}
