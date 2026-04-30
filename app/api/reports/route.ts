import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Auto-pruning: fetch only reports from the last 48 hours
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    const { data: rawReports, error } = await supabase
      .from('reports')
      .select('*')
      .gte('created_at', fortyEightHoursAgo.toISOString())
      .neq('status', 'RESOLVED')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json(rawReports || [])
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
