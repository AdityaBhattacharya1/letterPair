'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { ReactNode } from 'react'

function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}))

	return (
		<div className="absolute inset-0 pointer-events-none">
			<svg
				className="w-full h-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	)
}

export default function BackgroundPaths({
	title = 'Background Paths',
	children,
}: {
	title?: string
	children?: ReactNode
}) {
	const words = title.split(' ')

	return (
		<div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950 pt-10">
			<div className="absolute inset-0">
				<FloatingPaths position={1} />
				<FloatingPaths position={-1} />
			</div>

			<div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 2 }}
					className="max-w-4xl mx-auto"
				>
					<Link
						href="/"
						className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter"
					>
						{words.map((word, wordIndex) => (
							<span
								key={wordIndex}
								className="inline-block mr-4 last:mr-0"
							>
								{word.split('').map((letter, letterIndex) => (
									<motion.span
										key={`${wordIndex}-${letterIndex}`}
										initial={{ y: 100, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{
											delay:
												wordIndex * 0.1 +
												letterIndex * 0.03,
											type: 'spring',
											stiffness: 150,
											damping: 25,
										}}
										className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-neutral-900 to-neutral-700/80 
                                        dark:from-white dark:to-white/80"
									>
										{letter}
									</motion.span>
								))}
							</span>
						))}
					</Link>

					{children}
				</motion.div>
			</div>
		</div>
	)
}
