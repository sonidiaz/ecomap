"use client"

import { useState } from "react"
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

export function NetworkGraphSimple() {
  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'default',
      position: { x: 100, y: 100 },
      data: { label: 'Nodo 1' },
    },
    {
      id: '2',
      type: 'default',
      position: { x: 300, y: 100 },
      data: { label: 'Nodo 2' },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  return (
    <div className="h-screen w-full">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Grafo Simple - Test</h1>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
