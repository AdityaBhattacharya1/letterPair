"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface FontVisualizerProps {
  fontUrl: string
  fontName: string
}

export default function FontVisualizer({ fontUrl, fontName }: FontVisualizerProps) {
  const [fontFamily, setFontFamily] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const fontId = `font-${fontName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`

  useEffect(() => {
    // Create a style element to load the font
    const style = document.createElement("style")
    style.textContent = `
      @font-face {
        font-family: "${fontId}";
        src: url("${fontUrl}") format("truetype");
        font-weight: normal;
        font-style: normal;
      }
    `
    document.head.appendChild(style)
    setFontFamily(fontId)

    // Create a font face observer to detect when the font is loaded
    const font = new FontFace(fontId, `url(${fontUrl})`)
    font
      .load()
      .then(() => {
        document.fonts.add(font)
        setIsLoaded(true)
      })
      .catch((err) => {
        console.error("Font loading error:", err)
      })

    return () => {
      document.head.removeChild(style)
    }
  }, [fontUrl, fontId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0.5 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-md"
    >
      <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{fontName}</h4>

      <div
        className="h-32 flex items-center justify-center overflow-hidden"
        style={{ fontFamily: isLoaded ? fontFamily : "sans-serif" }}
      >
        {isLoaded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-6xl md:text-7xl"
          >
            Hxp
          </motion.div>
        ) : (
          <div className="text-neutral-400 dark:text-neutral-500 animate-pulse">Loading font...</div>
        )}
      </div>

      {isLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-sm text-neutral-600 dark:text-neutral-300"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Sample:</span>
              <p style={{ fontFamily }} className="mt-1">
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Numbers:</span>
              <p style={{ fontFamily }} className="mt-1">
                0123456789
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

