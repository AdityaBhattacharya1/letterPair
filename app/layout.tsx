import type React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
	title: 'Letter Pair - Font Compatibility Analyzer',
	description:
		'Analyze and find perfect font pairings with our advanced compatibility tool',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link
					href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@400;600&family=Roboto:wght@400;700&family=Lora:wght@400;700&display=swap"
					rel="stylesheet"
				/>
				<link rel="icon" href="/favicon.svg" sizes="any" />
				<script
					src="https://beamanalytics.b-cdn.net/beam.min.js"
					data-token="a24be98c-ce23-46dc-93d4-d67b6ca7118d"
					async
				></script>
			</head>
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
				>
					<ThemeToggle />
					{children}
				</ThemeProvider>
			</body>
		</html>
	)
}
