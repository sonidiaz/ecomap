import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase alphanumeric with hyphens'
    ),
  description: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tags: z.array(z.string()).default([]),
})

export const collaboratorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(['PERSON', 'ORGANIZATION', 'PROJECT']).default('PERSON'),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  collabActive: z.boolean().default(false),
  collabPast: z.boolean().default(false),
  contactFrequency: z.number().min(0).max(5).default(0),
})

export const excelRowSchema = z.object({
  nombre: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  direccion: z.string().min(1, 'Address is required'),
  empresa: z.string().optional(),
  tipo: z.enum(['Person', 'Organization', 'Project']).optional(),
  tags: z.string().optional(),
  colaboracion_activa: z.boolean().optional(),
  colaboracion_pasada: z.boolean().optional(),
  frecuencia_contacto: z.number().min(0).max(5).optional(),
  notas: z.string().optional(),
})

export const orgMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

export const updateOrgSchema = organizationSchema.partial()
