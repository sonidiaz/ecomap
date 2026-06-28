import { generateTemplate } from '@/lib/excel-template'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const buffer = generateTemplate()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ecomap-plantilla-colaboradores.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
