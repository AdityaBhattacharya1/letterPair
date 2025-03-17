import BackgroundPaths from '@/components/kokonutui/background-paths'
import Link from 'next/link'

export default function HomePage() {
	return (
		<BackgroundPaths title="Letter Pair">
			<div className="max-w-2xl mx-auto text-center mt-8">
				<p className="text-lg md:text-xl mb-10 text-neutral-700 dark:text-neutral-300">
					Discover perfect font pairings with our advanced
					compatibility analyzer
				</p>
				<Link
					href="/analyze"
					className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                    dark:from-white/10 p-px dark:to-black/10 rounded-2xl backdrop-blur-lg 
                    overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
				>
					<span
						className="rounded-[1.15rem] px-6 py-4 text-lg font-semibold backdrop-blur-md 
                        bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100 
                        text-black dark:text-white transition-all duration-300 flex items-center
                        group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                        hover:shadow-md dark:hover:shadow-neutral-800/50"
					>
						<span className="opacity-90 group-hover:opacity-100 transition-opacity">
							Analyze Fonts
						</span>
						<span
							className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                            transition-all duration-300"
						>
							→
						</span>
					</span>
				</Link>
			</div>
		</BackgroundPaths>
	)
}
