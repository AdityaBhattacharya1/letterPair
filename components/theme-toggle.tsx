'use client'
import { Moon, Sun, Github, HandCoins } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function ThemeToggle() {
	const { theme, setTheme } = useTheme()

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className="fixed top-4 right-4 z-50"
		>
			<Button
				variant="outline"
				size="icon"
				onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
				className="rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800"
			>
				<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">Toggle theme</span>
			</Button>
			<Link href="https://github.com/AdityaBhattacharya1/letterPair">
				<Button
					variant="outline"
					size="icon"
					className="rounded-full ml-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800"
				>
					<Github className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<Github className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				</Button>
			</Link>
			<Link href="https://github.com/sponsors/AdityaBhattacharya1">
				<Button
					variant="outline"
					size="icon"
					className="rounded-full ml-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800"
				>
					<HandCoins className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<HandCoins className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				</Button>
			</Link>
		</motion.div>
	)
}
