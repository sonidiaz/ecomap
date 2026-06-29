import { memo } from "react"
import { Handle, Position } from "@xyflow/react"
import type { Collaborator, ProximityScore, Orbit } from "@prisma/client"
import { getNodeSize } from "@/lib/utils"

interface NetworkNodeProps {
  data: {
    collaborator: Collaborator
    proximityScore: ProximityScore
    orbit: Orbit
    isHighlighted?: boolean
  }
}

function NetworkNodeComponent({ data }: NetworkNodeProps) {
  const { collaborator, proximityScore, orbit, isHighlighted } = data
  const size = getNodeSize(proximityScore.scoreTotal)

  // Colores por órbita
  const borderColors = {
    CORE: 'border-green-500',
    MID: 'border-yellow-500',
    PERIPHERY: 'border-gray-400',
  }

  const bgColors = {
    CORE: 'bg-green-50',
    MID: 'bg-yellow-50',
    PERIPHERY: 'bg-gray-50',
  }

  const textColors = {
    CORE: 'text-green-700',
    MID: 'text-yellow-700',
    PERIPHERY: 'text-gray-700',
  }

  // Iconos por tipo
  const typeIcons = {
    PERSON: '👤',
    ORGANIZATION: '🏢',
    PROJECT: '📋',
  }

  // Obtener inicial del nombre
  const initial = collaborator.name.charAt(0).toUpperCase()

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-full border-4
        ${borderColors[orbit]} ${bgColors[orbit]}
        ${isHighlighted ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
        transition-all duration-200 hover:scale-110 hover:shadow-lg
        cursor-pointer
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={collaborator.name}
    >
      {/* Avatar o inicial */}
      {collaborator.photoUrl ? (
        <img
          src={collaborator.photoUrl}
          alt={collaborator.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className={`text-2xl ${textColors[orbit]} font-bold`}>
            {initial}
          </span>
          <span className="text-xs mt-0.5">
            {typeIcons[collaborator.type]}
          </span>
        </div>
      )}

      {/* Badge de órbita (pequeño) */}
      <div
        className={`
          absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white
          ${orbit === 'CORE' ? 'bg-green-500' : orbit === 'MID' ? 'bg-yellow-500' : 'bg-gray-400'}
        `}
      />

      {/* Handle invisible para conexiones (futuro) */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

export const NetworkNode = memo(NetworkNodeComponent)
