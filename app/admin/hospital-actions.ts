"use server"

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export async function registerHospital(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string | null
  const address = formData.get('address') as string
  const latStr = formData.get('latitude') as string
  const lonStr = formData.get('longitude') as string
  const hasAmbulance = formData.get('hasAmbulance') === 'on'
  const ambulanceCount = parseInt(formData.get('ambulanceCount') as string) || 0
  const specializations = formData.get('specializations') as string | null

  if (!name || !phone || !address || !latStr || !lonStr) {
    throw new Error('Missing required fields')
  }

  const latitude = parseFloat(latStr)
  const longitude = parseFloat(lonStr)

  const specializationsArray = specializations 
    ? specializations.split(',').map(s => s.trim().toUpperCase())
    : []

  await prisma.hospital.create({
    data: {
      name,
      phone,
      email,
      address,
      latitude,
      longitude,
      hasAmbulance,
      ambulanceCount,
      specializations: specializationsArray,
    },
  })

  revalidatePath('/admin/hospitals')
}

export async function registerAmbulance(formData: FormData) {
  const hospitalId = parseInt(formData.get('hospitalId') as string)
  const vehicleNumber = formData.get('vehicleNumber') as string
  const driverName = formData.get('driverName') as string
  const driverPhone = formData.get('driverPhone') as string

  if (!hospitalId || !vehicleNumber || !driverName || !driverPhone) {
    throw new Error('Missing required fields')
  }

  await prisma.ambulance.create({
    data: {
      hospitalId,
      vehicleNumber,
      driverName,
      driverPhone,
    },
  })

  revalidatePath('/admin/hospitals')
}

export async function getHospitals() {
  return await prisma.hospital.findMany({
    include: {
      ambulances: true,
      dispatches: {
        take: 5,
        orderBy: { sentAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getHospital(id: number) {
  return await prisma.hospital.findUnique({
    where: { id },
    include: {
      ambulances: true,
      dispatches: {
        orderBy: { sentAt: 'desc' },
      },
    },
  })
}
