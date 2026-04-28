import { submitReport, resolveReport } from './actions'
import prisma from '@/lib/prisma'

export default async function Home() {
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

  // Priority sorting (CRITICAL > URGENT > MODERATE)
  const priorityWeight: Record<string, number> = { 'CRITICAL': 3, 'URGENT': 2, 'MODERATE': 1 }
  const reports = rawReports.sort((a, b) => {
    const pA = priorityWeight[a.priority] || 0
    const pB = priorityWeight[b.priority] || 0
    if (pB !== pA) return pB - pA
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return (
    <main className="max-w-[90rem] mx-auto p-5 min-h-screen pb-12 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
      
      <div className="lg:col-span-3 lg:sticky lg:top-5 flex flex-col gap-6">
      {/* Header */}
      <header className="mb-8 text-center glass-panel rounded-[2rem] p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
        <h1 className="font-heading text-5xl font-black tracking-tighter mb-2 bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">
          offSOS
        </h1>
        <p className="text-sm font-medium text-zinc-400">Crisis reporting that works anywhere</p>
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-xs font-bold text-zinc-300 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-[urgent-pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          {reports.length} ACTIVE REPORTS
        </div>
      </header>

      {/* Panic Button */}
      <section className="mb-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <form action={submitReport} id="panicForm" className="relative">
          <input type="hidden" name="name" value="Anonymous (Panic)" />
          <input type="hidden" name="location" id="panicLoc" value="Locating..." />
          <input type="hidden" name="status" value="HELP" />
          <input type="hidden" name="priority" value="CRITICAL" />
          <div dangerouslySetInnerHTML={{
            __html: `
            <div class="flex flex-col gap-3">
              <button 
                type="button" 
                class="w-full bg-gradient-to-b from-red-500 to-rose-700 hover:from-red-400 hover:to-rose-600 text-white font-heading font-black py-7 rounded-[2rem] text-3xl tracking-widest shadow-[0_10px_40px_-10px_rgba(225,29,72,0.8)] transition-all active:scale-[0.98] animate-pulse border border-red-400/30 flex items-center justify-center gap-3"
                onclick="const f=document.getElementById('panicForm');const s=(l)=>{document.getElementById('panicLoc').value=l;const d=navigator.platform+' '+(navigator.userAgent.match(/Android|iPhone|iPad/)?navigator.userAgent.match(/Android|iPhone|iPad/)[0]:'Web');window.location.href='sms:112?body='+encodeURIComponent('🚨 SOS PANIC!%0ALoc: '+l+'%0ADevice: '+d);setTimeout(()=>f.submit(),800)};const ip=()=>{fetch('http://ip-api.com/json').then(r=>r.json()).then(d=>s(d.lat.toFixed(5)+','+d.lon.toFixed(5))).catch(()=>s('Unknown Loc'))};if(navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>s(p.coords.latitude.toFixed(5)+','+p.coords.longitude.toFixed(5)),()=>ip(),{timeout:4000})}else{ip()}"
              >
                <span class="text-4xl drop-shadow-lg">🚨</span> PANIC
              </button>
              <button
                type="button"
                class="w-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-bold py-3 rounded-2xl text-xs uppercase tracking-widest border border-white/5 transition-all active:scale-95"
                onclick="const f=document.getElementById('panicForm');const s=(l)=>{document.getElementById('panicLoc').value=l;f.submit()};const ip=()=>{fetch('http://ip-api.com/json').then(r=>r.json()).then(d=>s(d.lat.toFixed(5)+','+d.lon.toFixed(5))).catch(()=>s('Unknown Loc'))};if(navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>s(p.coords.latitude.toFixed(5)+','+p.coords.longitude.toFixed(5)),()=>ip(),{timeout:4000})}else{ip()}"
              >
                🔕 Silent Trigger (No SMS / Animation)
              </button>
            </div>`
          }} />
        </form>
      </section>
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-5 mt-10 lg:mt-0">
      {/* Detailed Report Form */}
      <section className="glass-panel rounded-[2rem] p-6 mb-10">
        <h2 className="font-heading text-lg font-bold text-white mb-6 flex items-center gap-3">
          <span>Detailed Report</span>
          <div className="h-px bg-white/10 flex-1" />
        </h2>
        
        <form action={submitReport} className="flex flex-col gap-6">
          <input type="hidden" name="status" value="HELP" />
          <input type="hidden" name="latitude" id="latitude" />
          <input type="hidden" name="longitude" id="longitude" />

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Name</label>
            <input
              name="name"
              required
              type="text"
              className="w-full glass-input rounded-2xl p-4 text-white focus:outline-none placeholder:text-zinc-600 font-medium"
              placeholder="Your name or family name"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Location</label>
              <div
                dangerouslySetInnerHTML={{
                  __html: `<button type="button" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 px-3 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-emerald-400/20 bg-emerald-400/5 shadow-inner" onclick="document.getElementById('loc').value='Locating...';const f=()=>{fetch('http://ip-api.com/json').then(r=>r.json()).then(d=>{document.getElementById('loc').value=d.lat.toFixed(5)+', '+d.lon.toFixed(5);document.getElementById('latitude').value=d.lat;document.getElementById('longitude').value=d.lon;document.getElementById('navigateBtn').classList.remove('hidden')}).catch(e=>{document.getElementById('loc').value='';alert('Location totally blocked')})};if(navigator.geolocation&&window.isSecureContext!==false){navigator.geolocation.getCurrentPosition(p=>{const lat=p.coords.latitude.toFixed(5);const lon=p.coords.longitude.toFixed(5);document.getElementById('loc').value=lat+', '+lon;document.getElementById('latitude').value=lat;document.getElementById('longitude').value=lon;document.getElementById('navigateBtn').classList.remove('hidden');fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+p.coords.latitude+'&lon='+p.coords.longitude).then(r=>r.json()).then(d=>{if(d.display_name){document.getElementById('loc').value=d.display_name+' ('+lat+', '+lon+')'}}).catch(()=>{})},e=>{f()},{timeout:5000})}else{f()}">📍 AUTO GPS</button>`
                }}
              />
            </div>
            <input
              id="loc"
              name="location"
              required
              type="text"
              className="w-full glass-input rounded-2xl p-4 text-white focus:outline-none placeholder:text-zinc-600 font-medium"
              placeholder="e.g. GPS, 'near temple', 'beside highway'"
            />
            <div
              dangerouslySetInnerHTML={{
                __html: `<button type="button" id="navigateBtn" class="hidden mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2" onclick="const lat=document.getElementById('latitude').value;const lon=document.getElementById('longitude').value;if(lat&&lon){window.open('https://www.google.com/maps/search/?api=1&query='+lat+','+lon,'_blank')}else{alert('Please get location first')}">🧭 NAVIGATE</button>`
              }}
            />
            <label className="flex items-center gap-3 mt-3 text-sm text-zinc-400 cursor-pointer w-full p-3 bg-black/20 rounded-xl border border-transparent hover:border-white/5 transition-colors">
              <input type="checkbox" name="isPrivate" className="w-5 h-5 rounded-md bg-black/50 border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer" />
              Hide exact location from feed
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1">
            <label className="relative flex cursor-pointer rounded-2xl border border-white/5 bg-black/30 p-5 focus-within:ring-2 focus-within:ring-white/50 focus-within:border-white/50 hover:bg-white/5 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="radio" name="priority" value="MODERATE" className="sr-only" defaultChecked />
              <span className="relative flex flex-col items-center justify-center w-full gap-3 transition-transform group-active:scale-95">
                <span className="text-3xl drop-shadow-md">🟡</span>
                <span className="font-heading font-bold text-xs tracking-widest text-zinc-300">MODERATE</span>
              </span>
            </label>

            <label className="relative flex cursor-pointer rounded-2xl border border-white/5 bg-black/30 p-5 focus-within:ring-2 focus-within:ring-rose-500/50 focus-within:border-rose-500/50 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <input type="radio" name="priority" value="CRITICAL" className="sr-only" />
              <span className="relative flex flex-col items-center justify-center w-full gap-3 transition-transform group-active:scale-95">
                <span className="text-3xl drop-shadow-md group-hover:animate-pulse">🚨</span>
                <span className="font-heading font-bold text-xs tracking-widest text-rose-400">CRITICAL</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Category</label>
            <div className="relative">
              <select
                name="category"
                className="w-full glass-input rounded-2xl p-4 text-white focus:outline-none appearance-none font-medium pr-10"
              >
                <option value="">Select an emergency type...</option>
                <option value="MEDICAL">🩺 Medical Emergency</option>
                <option value="AMBULANCE">🚑 Ambulance Needed</option>
                <option value="FIRE">🔥 Fire Hazard</option>
                <option value="TRAPPED">🧱 Trapped / Immobolized</option>
                <option value="RESOURCES">💧 Need Food / Water</option>
                <option value="SECURITY">⚠️ Security Threat</option>
                <option value="FLOOD">🌊 Flood / High Water</option>
                <option value="INFRA_ROAD">🚧 Blocked Road</option>
                <option value="INFRA_BRIDGE">🌉 Collapsed Bridge</option>
                <option value="INFRA_POWER">⚡ Power / Comm Failure</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-zinc-500">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Additional Details</label>
            <input
              name="message"
              type="text"
              className="w-full glass-input rounded-2xl p-4 text-white focus:outline-none placeholder:text-zinc-600 font-medium"
              placeholder="e.g. Water is rising fast, trapped on roof"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 bg-white text-black font-heading font-black py-4 rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all text-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              BROADCAST SOS
            </button>
            <div dangerouslySetInnerHTML={{
              __html: `<button type="button" class="flex items-center justify-center bg-zinc-800 text-white px-6 py-4 rounded-2xl font-bold hover:bg-zinc-700 active:scale-95 transition-all border border-zinc-700 hover:border-zinc-600 shadow-lg" onclick="const f=this.closest('form');const loc=f.location.value||'Unknown';const cat=f.category.value;const msg=f.message.value;window.location.href='sms:112?body='+encodeURIComponent('OFFLINE SOS!%0ALoc: '+loc+'%0ACat: '+cat+'%0ADetails: '+msg);"><span class="text-xl mr-2">💬</span> SMS</button>`
            }} />
          </div>

        </form>
      </section>
      </div>

      <div className="lg:col-span-4 mt-10 lg:mt-0">
      {/* Live Feed */}
      <section className="h-full">
        <h2 className="font-heading text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center justify-between px-2">
          <span className="flex items-center gap-2">Live Feed <div className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" /></span>
          <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full font-mono border border-white/5">Last 48h</span>
        </h2>

        <div className="flex flex-col gap-4">
          {reports.length === 0 ? (
            <div className="text-center p-10 text-zinc-500 text-sm border border-dashed border-white/10 rounded-3xl bg-white/5">
              No active reports in your area.
            </div>
          ) : (
            reports.map((report: any) => {
              const isHelp = report.status === 'HELP'
              const isHidden = report.location.startsWith('[HIDDEN]')
              const rawLocation = report.location.replace('[HIDDEN]', '').trim()
              let displayLocation = rawLocation
              if (isHidden) {
                const parts = rawLocation.split(',')
                if (parts.length > 1 && isNaN(parseFloat(parts[parts.length-1]))) {
                  displayLocation = 'Near ' + parts[parts.length - 1].trim()
                } else if (parts.length > 1) {
                  const lat = parseFloat(parts[0]).toFixed(1)
                  const lon = parseFloat(parts[1]).toFixed(1)
                  displayLocation = `Approx (${lat}, ${lon})`
                } else {
                  displayLocation = 'Approximate Location'
                }
              }

              const getMessageIcon = (category: string | null, priority: string) => {
                let icon = '';
                if (category === 'MEDICAL') icon = '🩺 Medical';
                else if (category === 'AMBULANCE') icon = '🚑 Ambulance';
                else if (category === 'FIRE') icon = '🔥 Fire';
                else if (category === 'TRAPPED') icon = '🧱 Trapped';
                else if (category === 'RESOURCES') icon = '💧 Resources';
                else if (category === 'SECURITY') icon = '⚠️ Security';
                else if (category === 'FLOOD') icon = '🌊 Flood';
                else if (category === 'INFRA_ROAD') icon = '🚧 Blocked Road';
                else if (category === 'INFRA_BRIDGE') icon = '🌉 Collapsed Bridge';
                else if (category === 'INFRA_POWER') icon = '⚡ Power Failure';
                else icon = category || '';
                
                const priorityBadge = priority === 'CRITICAL' ? ' 🚨 CRITICAL' : '';
                return icon + priorityBadge;
              }

              return (
                <div
                  key={report.id}
                  className={`relative overflow-hidden rounded-3xl glass-panel p-5 transition-all hover:bg-white/[0.04] hover:-translate-y-0.5 ${isHelp
                      ? 'border-l-[6px] border-l-rose-500/80 shadow-[0_4px_20px_rgba(244,63,94,0.1)]'
                      : 'border-l-[6px] border-l-emerald-500/50'
                    }`}
                >
                  <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none text-8xl mix-blend-overlay">
                    {isHelp ? '🚨' : '🟢'}
                  </div>
                  
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <h3 className="font-heading font-bold text-white flex items-center gap-2 text-xl">
                      {report.name}
                    </h3>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] text-zinc-400 font-mono bg-black/40 px-2.5 py-1 rounded-md border border-white/5 shadow-inner">
                        {Math.max(0, Math.floor((Date.now() - new Date(report.createdAt).getTime()) / 60000))}m ago
                      </span>
                      {isHelp && (
                        <form action={resolveReport.bind(null, report.id)}>
                          <button type="submit" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all shadow-sm active:scale-95">
                            ✓ Help Received
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-300 font-medium mb-1 relative z-10 flex items-center gap-2">
                    <span className="opacity-50">📍</span> {displayLocation}
                    {report.latitude && report.longitude && (
                      <button
                        type="button"
                        className="ml-auto text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg border border-blue-500/20 transition-all active:scale-95 flex items-center gap-1"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`, '_blank')}
                      >
                        🧭 NAVIGATE
                      </button>
                    )}
                  </div>

                  {(report.category || report.priority === 'CRITICAL') && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`inline-flex items-center gap-2 bg-black/50 border ${report.priority === 'CRITICAL' ? 'border-rose-500/30 text-rose-400' : 'border-white/10 text-zinc-300'} text-xs px-3 py-1.5 rounded-lg font-bold shadow-inner relative z-10`}>
                        {getMessageIcon(report.category, report.priority)}
                      </div>
                      {(report.category === 'MEDICAL' || report.category === 'AMBULANCE') && (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-inner relative z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[urgent-pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                          AUTO-NOTIFIED
                        </div>
                      )}
                    </div>
                  )}

                  {report.message && (
                    <div className="mt-3 text-sm text-zinc-400 italic border-l-2 border-white/10 pl-3 py-1 relative z-10 bg-black/20 rounded-r-lg">
                      "{report.message}"
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('load', () => {
            const form = document.querySelector('form.flex.flex-col.gap-6');
            if (form) {
              form.addEventListener('submit', (e) => {
                if (!navigator.onLine) {
                  e.preventDefault();
                  const fd = new FormData(form);
                  const data = Object.fromEntries(fd.entries());
                  const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
                  queue.push(data);
                  localStorage.setItem('offlineQueue', JSON.stringify(queue));
                  alert('You are offline. Report saved and will auto-submit when connection is restored.');
                  form.reset();
                }
              });
            }

            window.addEventListener('online', () => {
              const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
              if (queue.length > 0) {
                alert('Connection restored! Submitting offline reports...');
                const data = queue.shift();
                localStorage.setItem('offlineQueue', JSON.stringify(queue));
                
                if(form) {
                  for (const [key, value] of Object.entries(data)) {
                    const input = form.elements.namedItem(key);
                    if (input) {
                      if (input.type === 'checkbox' || input.type === 'radio') {
                        if (input.length) {
                          Array.from(input).forEach(i => i.checked = (i.value === value));
                        } else {
                          input.checked = (value === 'on');
                        }
                      } else {
                        input.value = value;
                      }
                    }
                  }
                  form.submit();
                }
              }
            });
          });
        `
      }} />
    </main>
  )
}
