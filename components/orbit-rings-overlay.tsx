import { memo } from "react"
import { useViewport } from "@xyflow/react"

interface OrbitRingsOverlayProps {
  centerX: number
  centerY: number
  radii: {
    core: number      // Radio límite CORE (score 70)
    midInner: number  // Radio límite MID (score 40)
  }
}

function OrbitRingsOverlayComponent({ centerX, centerY, radii }: OrbitRingsOverlayProps) {
  const maxRadius = 400 // Radio exterior (PERIPHERY)
  const { x, y, zoom } = useViewport()

  // Transformar coordenadas del mundo React Flow a coordenadas de pantalla
  const transform = (worldX: number, worldY: number) => {
    return {
      x: worldX * zoom + x,
      y: worldY * zoom + y,
    }
  }

  const center = transform(centerX, centerY)
  const coreRadius = radii.core * zoom
  const midRadius = radii.midInner * zoom
  const peripheryRadius = maxRadius * zoom

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    >
      {/* Anillo CORE (score >= 70) */}
      <circle
        cx={center.x}
        cy={center.y}
        r={coreRadius}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2 / zoom}
        opacity="0.15"
      />
      <text
        x={center.x}
        y={center.y - coreRadius - 10}
        textAnchor="middle"
        fontSize={12 / zoom}
        fill="#22c55e"
        opacity="0.6"
        fontWeight="600"
      >
        CERCANO
      </text>

      {/* Anillo MID (score 40-69) */}
      <circle
        cx={center.x}
        cy={center.y}
        r={midRadius}
        fill="none"
        stroke="#eab308"
        strokeWidth={2 / zoom}
        opacity="0.15"
      />
      <text
        x={center.x}
        y={center.y - midRadius - 10}
        textAnchor="middle"
        fontSize={12 / zoom}
        fill="#eab308"
        opacity="0.6"
        fontWeight="600"
      >
        MEDIO
      </text>

      {/* Anillo PERIPHERY (score < 40) */}
      <circle
        cx={center.x}
        cy={center.y}
        r={peripheryRadius}
        fill="none"
        stroke="#9ca3af"
        strokeWidth={2 / zoom}
        opacity="0.15"
      />
      <text
        x={center.x}
        y={center.y - peripheryRadius - 10}
        textAnchor="middle"
        fontSize={12 / zoom}
        fill="#9ca3af"
        opacity="0.6"
        fontWeight="600"
      >
        LEJANO
      </text>
    </svg>
  )
}

export const OrbitRingsOverlay = memo(OrbitRingsOverlayComponent)
