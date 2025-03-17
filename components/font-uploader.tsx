'use client'

import type React from 'react'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface FontUploaderProps {
	label: string
	onUpload: (file: File) => void
	fileName?: string
}

export default function FontUploader({
	label,
	onUpload,
	fileName,
}: FontUploaderProps) {
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}

	const handleDragLeave = () => {
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0]
			if (
				file.name.endsWith('.ttf') ||
				file.name.endsWith('.otf') ||
				file.name.endsWith('.woff') ||
				file.name.endsWith('.woff2')
			) {
				onUpload(file)
			}
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onUpload(e.target.files[0])
		}
	}

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	return (
		<div className="font-uploader">
			<label className="block text-lg font-medium mb-2">{label}</label>
			<motion.div
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.99 }}
				className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                  ${
						isDragging
							? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
							: fileName
							? 'border-green-500 bg-green-50 dark:bg-green-900/20'
							: 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
					}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
			>
				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept=".ttf,.otf,.woff,.woff2"
					className="hidden"
				/>

				{fileName ? (
					<div>
						<div className="flex items-center justify-center mb-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8 text-green-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<p className="font-medium text-green-700 dark:text-green-300">
							{fileName}
						</p>
						<p className="text-sm mt-2 text-neutral-500 dark:text-neutral-400">
							Click or drag to replace
						</p>
					</div>
				) : (
					<div>
						<div className="flex items-center justify-center mb-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8 text-neutral-400 dark:text-neutral-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						</div>
						<p className="font-medium">
							Drop font file here or click to browse
						</p>
						<p className="text-sm mt-2 text-neutral-500 dark:text-neutral-400">
							Supports TTF, OTF, WOFF, WOFF2
						</p>
					</div>
				)}
			</motion.div>
		</div>
	)
}
