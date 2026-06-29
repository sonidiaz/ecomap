import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMockGraphData } from "@/lib/mock-data"
import { NetworkGraph } from "@/components/network-graph"

interface GraphPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

// Flag de desarrollo: cambia a 'false' para usar datos reales de la DB
const USE_MOCK_DATA = process.env.USE_MOCK_DATA !== 'false'

export default async function GraphPage({ params }: GraphPageProps) {
  const { orgSlug } = await params

  let collaborators
  let proximityScores
  let organizationName: string

  if (USE_MOCK_DATA) {
    // Modo desarrollo: usar datos mock
    console.log('📊 Using MOCK data for graph')
    const mockData = getMockGraphData("test-org-id")
    collaborators = mockData.collaborators
    proximityScores = mockData.proximityScores
    organizationName = orgSlug
  } else {
    // Modo producción: usar datos reales de la DB
    console.log('📊 Using REAL data from database')

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, name: true },
    })

    if (!org) {
      redirect(`/organizations`)
    }

    organizationName = org.name

    // Cargar colaboradores con sus scores
    collaborators = await prisma.collaborator.findMany({
      where: {
        orgId: org.id,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    proximityScores = await prisma.proximityScore.findMany({
      where: {
        orgId: org.id,
      },
    })
  }

  return (
    <div className="h-screen">
      <NetworkGraph
        collaborators={collaborators}
        proximityScores={proximityScores}
        organizationName={organizationName}
      />

      {/* Indicador visual en desarrollo */}
      {USE_MOCK_DATA && (
        <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium shadow-lg">
          🧪 Datos Mock (dev mode)
        </div>
      )}
    </div>
  )
}
