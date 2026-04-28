import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Auto-pruning: fetch only reports from the last 48 hours
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    const rawReports = await prisma.report.findMany({
      where: {
        createdAt: {
          gte: fortyEightHoursAgo
        },
        status: {
          not: 'RESOLVED'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(rawReports)
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
