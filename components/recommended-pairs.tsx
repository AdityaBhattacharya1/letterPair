'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const fontPairs = [
	{
		id: 1,
		heading: 'Georgia & Verdana',
		description:
			'A timeless combination that ensures readability with a classic serif and a highly legible sans-serif.',
		headingFont: 'Georgia',
		bodyFont: 'Verdana',
		sampleHeading: 'Elegance',
		sampleBody:
			'A refined and graceful quality that enhances visual appeal and readability in typography.',
	},
	{
		id: 2,
		heading: 'Montserrat & Roboto',
		description:
			'A modern and clean pairing that offers a contemporary look suitable for digital and print media.',
		headingFont: 'Montserrat',
		bodyFont: 'Roboto',
		sampleHeading: 'Simplicity',
		sampleBody:
			'The quality of being clear and easy to read, ensuring effective communication and design harmony.',
	},
	{
		id: 3,
		heading: 'Poppins & Merriweather',
		description:
			'A striking combination that blends a geometric sans-serif with a sophisticated serif for contrast and readability.',
		headingFont: 'Poppins',
		bodyFont: 'Merriweather',
		sampleHeading: 'Versatility',
		sampleBody:
			'The ability to adapt typography to different styles and contexts while maintaining clarity and aesthetics.',
	},
]

export default function RecommendedPairs() {
	return (
		<div className="max-w-2xl mx-auto px-4">
			<div className="flex flex-col gap-2">
				{fontPairs.map((pair, index) => (
					<FontPairCard key={pair.id} pair={pair} index={index} />
				))}
			</div>
		</div>
	)
}

function FontPairCard({
	pair,
	index,
}: {
	pair: (typeof fontPairs)[0]
	index: number
}) {
	const ref = useRef(null)
	const isInView = useInView(ref, { once: true, amount: 0.3 })

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 50 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
			transition={{ duration: 0.6, delay: index * 0.2 }}
			className="bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 group"
		>
			<div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

			<div className="p-6">
				<div className="mb-4">
					<h3 className="text-xl font-bold mb-1">{pair.heading}</h3>
					<p className="text-sm text-neutral-600 dark:text-neutral-400">
						{pair.description}
					</p>
				</div>

				<div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-5 mb-5">
					<div
						className="text-2xl font-bold mb-2"
						style={{ fontFamily: pair.headingFont }}
					>
						{pair.sampleHeading}
					</div>
					<div
						className="text-neutral-700 dark:text-neutral-300"
						style={{ fontFamily: pair.bodyFont }}
					>
						{pair.sampleBody}
					</div>
				</div>

				<div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
					<span>Heading: {pair.headingFont}</span>
					<span>Body: {pair.bodyFont}</span>
				</div>
			</div>
		</motion.div>
	)
}
