import { registerHospital, registerAmbulance, getHospitals } from '../hospital-actions'

export default async function AdminHospitalsPage() {
  // Note: This page will work once the schema is pushed to the database
  // Run: npx prisma db push
  
  let hospitals = []
  try {
    hospitals = await getHospitals()
  } catch (error) {
    console.error('Database not connected. Run: npx prisma db push')
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Hospital & Ambulance Management</h1>
      
      <div className="grid gap-8">
        {/* Hospital Registration Form */}
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Register Hospital</h2>
          <form action={registerHospital} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Hospital Name"
                required
                className="glass-input rounded-xl p-3 text-white"
              />
              <input
                name="phone"
                placeholder="Phone Number"
                required
                className="glass-input rounded-xl p-3 text-white"
              />
            </div>
            <input
              name="email"
              placeholder="Email (optional)"
              type="email"
              className="glass-input rounded-xl p-3 text-white w-full"
            />
            <input
              name="address"
              placeholder="Full Address"
              required
              className="glass-input rounded-xl p-3 text-white w-full"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="latitude"
                placeholder="Latitude"
                required
                type="number"
                step="any"
                className="glass-input rounded-xl p-3 text-white"
              />
              <input
                name="longitude"
                placeholder="Longitude"
                required
                type="number"
                step="any"
                className="glass-input rounded-xl p-3 text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="hasAmbulance" className="w-5 h-5" />
                Has Ambulance
              </label>
              <input
                name="ambulanceCount"
                placeholder="Ambulance Count"
                type="number"
                defaultValue="0"
                className="glass-input rounded-xl p-3 text-white w-32"
              />
            </div>
            <input
              name="specializations"
              placeholder="Specializations (comma-separated, e.g., TRAUMA, CARDIAC)"
              className="glass-input rounded-xl p-3 text-white w-full"
            />
            <button
              type="submit"
              className="bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Register Hospital
            </button>
          </form>
        </section>

        {/* Hospitals List */}
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Registered Hospitals</h2>
          {hospitals.length === 0 ? (
            <p className="text-zinc-400">No hospitals registered yet.</p>
          ) : (
            <div className="space-y-4">
              {hospitals.map((hospital: any) => (
                <div key={hospital.id} className="border border-white/10 rounded-xl p-4">
                  <h3 className="font-bold text-lg">{hospital.name}</h3>
                  <p className="text-sm text-zinc-400">{hospital.address}</p>
                  <p className="text-sm text-zinc-400">Phone: {hospital.phone}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className={hospital.hasAmbulance ? 'text-emerald-400' : 'text-zinc-500'}>
                      {hospital.hasAmbulance ? '✓ Has Ambulance' : '✗ No Ambulance'}
                    </span>
                    <span className="text-zinc-400">
                      {hospital.ambulances?.length || 0} Ambulances Registered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
