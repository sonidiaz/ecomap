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

export default async function GraphPage({ params }: GraphPageProps) {
  // Obtener datos simulados del grafo (sin auth por ahora)
  // Usando datos estáticos pre-generados (30 colaboradores) - mucho más rápido
  const { collaborators, proximityScores } = getMockGraphData("test-org-id")

  return (
    <div className="h-screen">
      <NetworkGraph
        collaborators={collaborators}
        proximityScores={proximityScores}
      />
    </div>
  )
}
