"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import type { Collaborator, ProximityScore, Orbit } from "@prisma/client"
import { NetworkNode } from "./network-node"
import { OrganizationCenterNode } from "./organization-center-node"
import { OrbitRingsOverlay } from "./orbit-rings-overlay"
import { GraphControls } from "./graph-controls"
import { NodeDetailsPanel } from "./node-details-panel"
import { distributeNodesOrbitally, getOrbitRingRadii } from "@/lib/orbital-layout"

interface NetworkGraphProps {
  collaborators: Collaborator[]
  proximityScores: ProximityScore[]
  organizationName: string
}

const nodeTypes = {
  custom: NetworkNode,
  organizationCenter: OrganizationCenterNode,
}

export function NetworkGraph({ collaborators, proximityScores, organizationName }: NetworkGraphProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [orbitFilters, setOrbitFilters] = useState<Set<Orbit>>(
    new Set(['CORE', 'MID', 'PERIPHERY'])
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Crear mapa de scores por collaboratorId
  const scoresMap = useMemo(() => {
    const map = new Map<string, ProximityScore>()
    proximityScores.forEach(score => {
      map.set(score.collaboratorId, score)
    })
    return map
  }, [proximityScores])

  // Crear nodos de React Flow con layout orbital
  const initialNodes: Node[] = useMemo(() => {
    const centerX = 500
    const centerY = 400

    // Nodo central de la organización
    const centerNode: Node = {
      id: 'org-center',
      type: 'organizationCenter',
      position: { x: centerX - 50, y: centerY - 50 }, // Offset para centrar (100px / 2)
      data: { organizationName },
      draggable: false,
      selectable: false,
    }

    // Calcular posiciones orbitales para colaboradores
    const positions = distributeNodesOrbitally(
      collaborators,
      proximityScores,
      { x: centerX, y: centerY }
    )

    // Crear nodos de colaboradores
    const collaboratorNodes: Node[] = positions.map(pos => {
      const collab = collaborators.find(c => c.id === pos.id)
      const score = scoresMap.get(pos.id)
      if (!collab || !score) return null

      return {
        id: pos.id,
        type: 'custom',
        position: { x: pos.x, y: pos.y },
        data: {
          collaborator: collab,
          proximityScore: score,
          orbit: score.orbit,
          isHighlighted: false,
        },
      }
    }).filter(Boolean) as Node[]

    return [centerNode, ...collaboratorNodes]
  }, [collaborators, proximityScores, scoresMap])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Filtrar nodos según filtros y búsqueda (sin modificar el estado)
  const visibleNodes = useMemo(() => {
    return nodes.map(node => {
      // El nodo central siempre es visible
      if (node.id === 'org-center') {
        return node
      }

      const score = scoresMap.get(node.id)
      if (!score) return null

      // Aplicar filtro de órbita
      if (!orbitFilters.has(score.orbit)) {
        return { ...node, hidden: true }
      }

      // Aplicar búsqueda
      const collab = collaborators.find(c => c.id === node.id)
      if (!collab) return null

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = searchTerm === "" ||
        collab.name.toLowerCase().includes(searchLower) ||
        collab.email?.toLowerCase().includes(searchLower) ||
        collab.company?.toLowerCase().includes(searchLower)

      return {
        ...node,
        hidden: !matchesSearch,
        data: {
          ...node.data,
          isHighlighted: searchTerm !== "" && matchesSearch,
        },
      }
    }).filter(Boolean) as Node[]
  }, [nodes, orbitFilters, searchTerm, scoresMap, collaborators])

  // Handler para click en nodo
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  // Toggle de filtro de órbita
  const handleOrbitToggle = useCallback((orbit: Orbit) => {
    setOrbitFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(orbit)) {
        newFilters.delete(orbit)
      } else {
        newFilters.add(orbit)
      }
      return newFilters
    })
  }, [])

  // Contador de nodos visibles
  const visibleCount = visibleNodes.filter(n => !n.hidden).length

  // Obtener datos del nodo seleccionado
  const selectedCollaborator = selectedNodeId
    ? collaborators.find(c => c.id === selectedNodeId) || null
    : null

  const selectedScore = selectedNodeId
    ? scoresMap.get(selectedNodeId) || null
    : null

  return (
    <div className="flex flex-col h-screen">
      {/* Controles superiores */}
      <GraphControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        orbitFilters={orbitFilters}
        onOrbitToggle={handleOrbitToggle}
        visibleCount={visibleCount}
        totalCount={collaborators.length}
      />

      {/* Grafo */}
      <div className="flex-1">
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const orbit = node.data?.orbit as Orbit
              return orbit === 'CORE'
                ? '#22c55e'
                : orbit === 'MID'
                ? '#eab308'
                : '#9ca3af'
            }}
          />
          <OrbitRingsOverlay
            centerX={500}
            centerY={400}
            radii={getOrbitRingRadii({ x: 500, y: 400 })}
          />
        </ReactFlow>
      </div>

      {/* Panel de detalles */}
      <NodeDetailsPanel
        isOpen={selectedNodeId !== null}
        onClose={() => setSelectedNodeId(null)}
        collaborator={selectedCollaborator}
        proximityScore={selectedScore}
        allCollaborators={collaborators}
      />
    </div>
  )
}
