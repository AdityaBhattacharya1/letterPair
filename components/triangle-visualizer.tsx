'use client'

import React from 'react'
import Plot from 'react-plotly.js'

interface TriangleMethodData {
	points: {
		A: [number, number, number]
		B: [number, number, number]
		C: [number, number, number]
	}
	area: number
	perimeter: number
}

interface TriangleVisualizationPlotlyProps {
	data: TriangleMethodData
}

export default function TriangleVisualizationPlotly({
	data,
}: TriangleVisualizationPlotlyProps) {
	const scale = 150
	const project = (point: [number, number, number]) => ({
		x: point[0] * scale,
		y: point[1] * scale,
	})
	const pA = project(data.points.A)
	const pB = project(data.points.B)
	const pC = project(data.points.C)
	const triangleX = [pA.x, pB.x, pC.x, pA.x]
	const triangleY = [pA.y, pB.y, pC.y, pA.y]

	const traceTriangle: Partial<Plotly.ScatterData> = {
		x: triangleX,
		y: triangleY,
		mode: 'lines',
		type: 'scatter',
		line: { color: '#3B82F6', width: 3 },
		name: 'Triangle',
	}

	const tracePoints: Partial<Plotly.ScatterData> = {
		x: [pA.x, pB.x, pC.x],
		y: [pA.y, pB.y, pC.y],
		mode: 'markers+text' as any,
		type: 'scatter',
		marker: { size: 10, color: '#EF4444' },
		text: ['A', 'B', 'C'],
		textposition: 'top center',
		name: 'Font Points',
	}

	const layout = {
		title: 'Triangle Method Visualization',
		xaxis: {
			title: 'Stroke Contrast (scaled)',
			zeroline: false,
			color: '#d1d5db',
			gridcolor: '#374151',
		},
		yaxis: {
			title: 'Average Character Width (scaled)',
			zeroline: false,
			color: '#d1d5db',
			gridcolor: '#374151',
		},
		showlegend: true,
		margin: { l: 50, r: 50, b: 50, t: 50 },
		dragmode: 'pan' as const,
		paper_bgcolor: '#1f2937',
		plot_bgcolor: '#1f2937',
		font: { color: '#d1d5db' },
	}

	const config = {
		scrollZoom: true,
		responsive: true,
		displayModeBar: true,
	}

	return (
		<div className="mt-8 bg-neutral-900 rounded-xl p-6 shadow-lg">
			<Plot
				data={[traceTriangle, tracePoints]}
				layout={layout}
				config={config}
				style={{ width: '100%', height: '500px' }}
			/>
			<div className="text-center text-neutral-300 mt-4">
				<p className="mb-2">
					This interactive graph shows the triangle formed by the
					three fonts in a projected 2D metric space.
				</p>
				<p className="mb-1">
					<strong>Area:</strong> {data.area.toFixed(3)} — Larger area
					suggests greater diversity among the fonts.
				</p>
				<p>
					<strong>Perimeter:</strong> {data.perimeter.toFixed(3)} —
					Higher perimeter indicates more pronounced differences.
				</p>
				<p className="mt-2 text-sm">
					Drag to pan and scroll to zoom on the graph.
				</p>
			</div>
		</div>
	)
}
