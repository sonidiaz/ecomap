import * as XLSX from 'xlsx'

export const TEMPLATE_COLUMNS = [
  'nombre*',
  'email*',
  'direccion*',
  'empresa',
  'tipo',
  'tags',
  'colaboracion_activa',
  'colaboracion_pasada',
  'frecuencia_contacto',
  'notas',
]

export function generateTemplate(): Buffer {
  // Create main sheet with columns and example data
  const worksheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_COLUMNS,
    // Example row 1
    [
      'Juan Pérez',
      'juan.perez@example.com',
      'Calle Falsa 123, Buenos Aires, Argentina',
      'Tech Corp',
      'Person',
      'tech, sustainability',
      'TRUE',
      'FALSE',
      '4',
      'Met at conference 2024',
    ],
    // Example row 2
    [
      'María González',
      'maria.gonzalez@example.com',
      'Av. Libertador 456, Buenos Aires, Argentina',
      'Green Solutions',
      'Person',
      'sustainability, design',
      'FALSE',
      'TRUE',
      '3',
      'Previous collaborator on eco project',
    ],
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Collaborators')

  // Add instructions sheet
  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['EcoMap - Plantilla de Importación de Colaboradores'],
    [''],
    ['CAMPOS OBLIGATORIOS (marcados con *):'],
    [''],
    ['• nombre*'],
    ['  Nombre completo del colaborador'],
    ['  Ejemplo: "Juan Pérez"'],
    [''],
    ['• email*'],
    ['  Dirección de email (debe ser única)'],
    ['  Ejemplo: "juan@example.com"'],
    [''],
    ['• direccion*'],
    ['  Dirección completa para geocodificación'],
    ['  Ejemplo: "Calle Falsa 123, Buenos Aires, Argentina"'],
    ['  Nota: Cuanto más detallada, mejor será la geocodificación'],
    [''],
    ['CAMPOS OPCIONALES:'],
    [''],
    ['• empresa'],
    ['  Nombre de la empresa u organización'],
    [''],
    ['• tipo'],
    ['  Tipo de colaborador: Person, Organization, o Project'],
    ['  Por defecto: Person'],
    [''],
    ['• tags'],
    ['  Etiquetas separadas por comas'],
    ['  Ejemplo: "tech, sustainability, community"'],
    ['  Se usan para calcular afinidad temática'],
    [''],
    ['• colaboracion_activa'],
    ['  ¿Están colaborando actualmente?'],
    ['  Valores: TRUE o FALSE'],
    ['  Impacto en score: +30 puntos si TRUE'],
    [''],
    ['• colaboracion_pasada'],
    ['  ¿Han colaborado en el pasado?'],
    ['  Valores: TRUE o FALSE'],
    ['  Impacto en score: +20 puntos si TRUE'],
    [''],
    ['• frecuencia_contacto'],
    ['  Frecuencia de contacto reciente (0-5)'],
    ['  0 = Sin contacto, 5 = Contacto muy frecuente'],
    ['  Impacto en score: hasta +15 puntos'],
    [''],
    ['• notas'],
    ['  Notas adicionales sobre el colaborador'],
    [''],
    ['IMPORTANTE:'],
    [''],
    ['• Las columnas NO pueden moverse ni renombrarse'],
    ['• Los emails deben ser únicos'],
    ['• En importaciones posteriores, los colaboradores existentes se actualizan por email'],
    ['• La geocodificación se realiza automáticamente al importar'],
    [''],
    ['PUNTUACIÓN DE PROXIMIDAD:'],
    [''],
    ['La puntuación total (0-100) se calcula como:'],
    ['• Colaboración activa: 0-30 puntos'],
    ['• Colaboración pasada: 0-20 puntos'],
    ['• Proximidad geográfica: 0-20 puntos (100% a 0km, 0% a >500km)'],
    ['• Frecuencia de contacto: 0-15 puntos'],
    ['• Afinidad temática (tags): 0-15 puntos'],
    [''],
    ['ÓRBITAS:'],
    ['• Core (>= 70 puntos): Colaboradores más cercanos'],
    ['• Mid (40-69 puntos): Colaboradores medianamente cercanos'],
    ['• Periphery (< 40 puntos): Colaboradores distantes'],
  ])

  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
