import prisma from '@/lib/prisma'

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Find nearest hospitals within a radius
export async function findNearbyHospitals(
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 10,
  limit: number = 5
) {
  const hospitals = await prisma.hospital.findMany({
    where: {
      isActive: true,
    },
    include: {
      ambulances: {
        where: { isAvailable: true },
      },
    },
  })

  // Calculate distances and sort
  const hospitalsWithDistance = hospitals
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude),
    }))
    .filter(h => h.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)

  return hospitalsWithDistance
}

// Send notification to hospital (SMS/Call via Twilio)
export async function notifyHospital(
  hospitalId: number,
  reportId: number,
  type: 'SMS' | 'CALL' = 'SMS'
) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    include: { ambulances: true },
  })

  if (!hospital) {
    throw new Error('Hospital not found')
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
  })

  if (!report) {
    throw new Error('Report not found')
  }

  // Create dispatch log
  const dispatchLog = await prisma.dispatchLog.create({
    data: {
      reportId,
      hospitalId,
      type,
      message: `EMERGENCY: ${report.name} at ${report.location}. Priority: ${report.priority}. Category: ${report.category || 'Unknown'}`,
      status: 'SENT',
    },
  })

  // In production, integrate with Twilio here
  // For now, we'll simulate the notification
  console.log(`[${type}] Sent to ${hospital.name} (${hospital.phone}): ${dispatchLog.message}`)

  // If hospital has ambulances, dispatch the nearest available one
  if (hospital.ambulances.length > 0) {
    const availableAmbulance = hospital.ambulances[0]
    await dispatchAmbulance(availableAmbulance.id, reportId)
  }

  return dispatchLog
}

// Dispatch ambulance to emergency location
export async function dispatchAmbulance(ambulanceId: number, reportId: number) {
  const ambulance = await prisma.ambulance.findUnique({
    where: { id: ambulanceId },
    include: { hospital: true },
  })

  if (!ambulance) {
    throw new Error('Ambulance not found')
  }

  // Update ambulance status
  await prisma.ambulance.update({
    where: { id: ambulanceId },
    data: { isAvailable: false },
  })

  // Create dispatch log
  const dispatchLog = await prisma.dispatchLog.create({
    data: {
      reportId,
      ambulanceId,
      hospitalId: ambulance.hospitalId,
      type: 'PUSH',
      message: `Ambulance ${ambulance.vehicleNumber} dispatched. Driver: ${ambulance.driverName} (${ambulance.driverPhone})`,
      status: 'DISPATCHED',
    },
  })

  console.log(`[DISPATCH] ${dispatchLog.message}`)

  return dispatchLog
}

// Auto-dispatch for critical emergencies
export async function autoDispatchForEmergency(reportId: number) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  })

  if (!report || !report.latitude || !report.longitude) {
    console.log('[AUTO-DISPATCH] Cannot dispatch - missing location data')
    return
  }

  // Only auto-dispatch for critical/urgent medical emergencies
  if (report.priority !== 'CRITICAL' && report.category !== 'MEDICAL' && report.category !== 'AMBULANCE') {
    console.log('[AUTO-DISPATCH] Not a critical medical emergency')
    return
  }

  console.log(`[AUTO-DISPATCH] Finding nearby hospitals for ${report.category} emergency`)

  // Find nearby hospitals
  const nearbyHospitals = await findNearbyHospitals(
    report.latitude,
    report.longitude,
    10, // 10km radius
    3  // Top 3 hospitals
  )

  if (nearbyHospitals.length === 0) {
    console.log('[AUTO-DISPATCH] No nearby hospitals found')
    return
  }

  // Notify nearest hospital
  const nearestHospital = nearbyHospitals[0]
  await notifyHospital(nearestHospital.id, reportId, 'SMS')

  // If no ambulance available, notify next hospital
  if (nearestHospital.ambulances.length === 0 && nearbyHospitals.length > 1) {
    await notifyHospital(nearbyHospitals[1].id, reportId, 'SMS')
  }

  console.log(`[AUTO-DISPATCH] Notified ${nearbyHospitals.length} hospital(s)`)
}
