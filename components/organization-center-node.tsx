import { memo } from "react"

interface OrganizationCenterNodeProps {
  data: {
    organizationName: string
  }
}

function OrganizationCenterNodeComponent({ data }: OrganizationCenterNodeProps) {
  const { organizationName } = data

  return (
    <div
      className="
        relative flex flex-col items-center justify-center
        rounded-full border-4 border-blue-600
        bg-gradient-to-br from-blue-50 to-blue-100
        shadow-2xl
        pointer-events-none
      "
      style={{
        width: '100px',
        height: '100px',
      }}
    >
      {/* Icono de organización */}
      <div className="text-3xl mb-1">🏢</div>

      {/* Nombre de la organización */}
      <div className="text-[10px] font-bold text-blue-900 text-center px-2 leading-tight">
        {organizationName}
      </div>

      {/* Indicador central (punto brillante) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 bg-blue-500 rounded-full opacity-50 animate-pulse" />
      </div>
    </div>
  )
}

export const OrganizationCenterNode = memo(OrganizationCenterNodeComponent)
