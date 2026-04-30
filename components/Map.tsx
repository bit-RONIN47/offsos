'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

interface Report {
  id: number
  name: string
  location: string
  status: string
  priority: string
  message?: string
  category?: string
  latitude?: number
  longitude?: number
  created_at: string
}

interface LeafletMap {
  map: (element: HTMLElement) => any
  tileLayer: (url: string, options: any) => any
  marker: (coords: [number, number], options?: any) => any
  divIcon: (options: any) => any
  latLngBounds: (points: [number, number][]) => any
}

interface MapProps {
  reports: Report[]
  userLocation?: { lat: number; lng: number } | null
}

export default function Map({ reports, userLocation }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [L, setL] = useState<LeafletMap | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import Leaflet only on client side
    import('leaflet').then((leaflet) => {
      setL({
        map: leaflet.map,
        tileLayer: leaflet.tileLayer,
        marker: leaflet.marker,
        divIcon: leaflet.divIcon,
        latLngBounds: leaflet.latLngBounds
      })
    })
  }, [])

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([20, 0], 2)
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [L])

  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    const map = mapInstanceRef.current
    
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer.getLatLng) {
        map.removeLayer(layer)
      }
    })

    // Add markers for reports with valid coordinates
    const validReports = reports.filter(report => 
      report.latitude && report.longitude && !report.location.startsWith('[HIDDEN]')
    )

    // Collect all points for bounds calculation
    const allPoints: [number, number][] = validReports.map(report => [report.latitude!, report.longitude!])
    
    // Add user location to points if available
    if (userLocation) {
      allPoints.push([userLocation.lat, userLocation.lng])
    }

    if (allPoints.length > 0) {
      // Create bounds to fit all markers
      const bounds = L.latLngBounds(allPoints)
      
      // Fit map to show all markers
      map.fitBounds(bounds, { padding: [50, 50] })

      // Add report markers
      validReports.forEach(report => {
        const isHelp = report.status === 'HELP'
        const isCritical = report.priority === 'CRITICAL'
        
        // Create custom icon based on priority
        const iconHtml = `
          <div style="
            background: ${isCritical ? '#dc2626' : isHelp ? '#f59e0b' : '#10b981'};
            border: 2px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${isCritical ? '!' : isHelp ? '?' : '✓'}
          </div>
        `
        
        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })

        const marker = L.marker([report.latitude!, report.longitude!], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${report.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Location:</strong> ${report.location}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Status:</strong> ${report.status}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Priority:</strong> ${report.priority}</p>
              ${report.category ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Category:</strong> ${report.category}</p>` : ''}
              ${report.message ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Message:</strong> "${report.message}"</p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">
                ${new Date(report.created_at).toLocaleString()}
              </p>
            </div>
          `)
        
        marker.on('mouseover', () => marker.openPopup())
      })

      // Add user location marker with higher precision
      if (userLocation) {
        const userIconHtml = `
          <div style="
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(59,130,246,0.6);
            animation: pulse 2s infinite;
            z-index: 1000;
          ">
            �
          </div>
        `
        
        const userIcon = L.divIcon({
          html: userIconHtml,
          className: 'user-location-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })

        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #3b82f6;">� Your Exact Location</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                <strong>Precise Coordinates:</strong><br/>
                ${userLocation.lat.toFixed(8)}, ${userLocation.lng.toFixed(8)}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">
                High-precision GPS location
              </p>
            </div>
          `)
        
        userMarker.on('mouseover', () => userMarker.openPopup())
        
        // Center map on user location with slight zoom
        map.setView([userLocation.lat, userLocation.lng], 15, { animate: true })
      }
    } else {
      // Reset view if no valid reports or user location
      map.setView([20, 0], 2)
    }
  }, [reports, userLocation])

  if (!isClient) {
    return (
      <div 
        style={{ 
          height: '400px', 
          width: '100%', 
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.1)'
        }} 
      >
        <div style={{ color: '#666' }}>Loading map...</div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '400px', 
        width: '100%', 
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }} 
    />
  )
}
