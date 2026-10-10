import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Tag, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { addAnimal, getAnimals, generateAnimalTag } from '@/services/animalService'
import { AnimalIcon } from '@/components/ui/AnimalIcon'
import type { AnimalType, AnimalGender, AnimalHealthStatus } from '@/types'

const COMMON_BREEDS: Record<AnimalType, string[]> = {
  Cow: ['Gir', 'Sahiwal', 'Red Sindhi', 'Tharparkar', 'Kankrej', 'Rathi', 'Hariana', 'Crossbred HF/Jersey', 'Indigenous Non-Descript'],
  Buffalo: ['Murrah', 'Nili-Ravi', 'Jaffarabadi', 'Surti', 'Mehsana', 'Bhadawari', 'Indigenous Non-Descript'],
  Goat: ['Jamnapari', 'Barbari', 'Sirohi', 'Black Bengal', 'Beetal', 'Osmanabadi', 'Indigenous'],
  Sheep: ['Marwari', 'Deccani', 'Nellore', 'Malpura', 'Mandya', 'Indigenous'],
  Poultry: ['Kadaknath', 'Aseel', 'Chabro', 'Broiler', 'Commercial Layer', 'Country Fowl'],
  Other: ['Camel', 'Equine', 'Swine', 'Other Species'],
}

export function AddAnimalPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const ownerId = user?.id || 'demo-farmer'

  const [existingCount, setExistingCount] = useState(3)
  const [animalType, setAnimalType] = useState<AnimalType>('Cow')
  const [breed, setBreed] = useState('Gir')
  const [gender, setGender] = useState<AnimalGender>('Female')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [age, setAge] = useState<number>(3)
  const [weight, setWeight] = useState<number>(350)
  const [color, setColor] = useState('')
  const [village, setVillage] = useState('Rampur Khurd')
  const [district, setDistrict] = useState('Varanasi')
  const [healthStatus, setHealthStatus] = useState<AnimalHealthStatus>('Healthy')

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successTag, setSuccessTag] = useState<string | null>(null)
  const [createdAnimalId, setCreatedAnimalId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        const list = await getAnimals(ownerId)
        setExistingCount(list.length)
      } catch (e) {
        console.warn(e)
      }
    }
    fetchCount()
  }, [ownerId])

  const previewTag = generateAnimalTag(animalType, existingCount)

  const handleTypeChange = (type: AnimalType) => {
    setAnimalType(type)
    const breedList = COMMON_BREEDS[type] || []
    if (breedList.length > 0) {
      setBreed(breedList[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!animalType || !gender) {
      setErrorMsg('Please select Animal Type and Gender.')
      return
    }

    try {
      setSaving(true)
      const created = await addAnimal({
        owner_id: ownerId,
        animal_type: animalType,
        breed,
        gender,
        date_of_birth: dateOfBirth || undefined,
        age: Number(age) || 2,
        weight: Number(weight) || undefined,
        color: color || undefined,
        village,
        district,
        location: `${village}, ${district}`,
        health_status: healthStatus,
      })

      setSuccessTag(created.animal_tag)
      setCreatedAnimalId(created.id)
    } catch (err: unknown) {
      console.error('Failed to register animal:', err)
      setErrorMsg('Failed to register animal. Please check connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-5 max-w-4xl mx-auto">
      {/* 1. Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
        <Link to="/farmer/dashboard" className="hover:text-[#1B5E3C]">
          DASHBOARD
        </Link>
        <span>&gt;</span>
        <Link to="/farmer/animals" className="hover:text-[#1B5E3C]">
          LIVESTOCK REGISTRY
        </Link>
        <span>&gt;</span>
        <span className="text-[#102A43] font-bold">REGISTER ANIMAL</span>
      </div>

      {/* 2. Institutional Title Header */}
      <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs border-l-4 border-l-[#1B5E3C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1B5E3C] text-white px-2 py-0.5 rounded-[1px]">
            STATUTORY ANIMAL REGISTRATION
          </span>
          <h1 className="text-xl font-bold text-[#102A43] mt-1 font-sans">
            नया पशु पंजीकृत करें &middot; Register Animal Tag
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Assign digital ear-tag and initiate statutory health passport under NADRS-II surveillance protocol.
          </p>
        </div>

        <Link
          to="/farmer/animals"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 rounded-[2px] transition-colors self-start sm:self-auto font-mono"
        >
          <ArrowLeft size={14} />
          <span>BACK TO LIST</span>
        </Link>
      </div>

      {/* Success Notification Dialog */}
      {successTag && (
        <div className="bg-[#EBF5EE] border-2 border-[#2E7D32] p-5 rounded-[2px] shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-[#2E7D32] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-[#1B5E3C] uppercase tracking-wide font-mono">
                पशु सफलतापूर्वक पंजीकृत किया गया &middot; ANIMAL REGISTERED SUCCESSFULLY
              </h2>
              <p className="text-xs text-stone-700 mt-1">
                Allocated Official Ear-Tag: <strong className="font-mono text-[#102A43] bg-white px-2 py-0.5 border border-stone-300 rounded-[2px]">{successTag}</strong>
              </p>
              <p className="text-xs text-stone-600 mt-1">
                The health passport is active and linked to the National Animal Disease Reporting System.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#2E7D32]/20 font-mono">
            {createdAnimalId && (
              <button
                type="button"
                onClick={() => navigate(`/farmer/animals/${createdAnimalId}`)}
                className="px-4 py-2 bg-[#1B5E3C] text-white text-xs font-bold rounded-[2px] hover:bg-[#123C2A] transition-colors cursor-pointer"
              >
                पशु स्वास्थ्य प्रोफाइल देखें &middot; VIEW COW HEALTH PROFILE &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/farmer/animals')}
              className="px-3.5 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-[2px] hover:bg-stone-50 transition-colors cursor-pointer"
            >
              LIVESTOCK REGISTRY
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessTag(null)
                setCreatedAnimalId(null)
                setExistingCount((prev) => prev + 1)
              }}
              className="px-3 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold transition-colors cursor-pointer"
            >
              + REGISTER ANOTHER
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      {!successTag && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-[#FFF8F7] border border-[#C62828] p-3 rounded-[2px] text-xs text-[#C62828] flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Assigned Tag Preview Banner */}
          <div className="bg-[#102A43] text-white p-4 rounded-[2px] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[2px] bg-white/10 flex items-center justify-center text-[#8BC34A]">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-white/60 tracking-wider">
                  SYSTEM-ALLOCATED EAR TAG NUMBER
                </p>
                <p className="text-lg font-mono font-bold text-white tracking-widest">
                  {previewTag}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-[#8BC34A] bg-white/10 px-2 py-0.5 rounded-[1px]">
                NADRS-II READY
              </span>
            </div>
          </div>

          {/* Section 1: Species & Breed */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono border-b border-stone-200 pb-2">
              1. SPECIES CLASSIFICATION & BREED &middot; प्रजाति एवं नस्ल
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Species selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Livestock Species (पशु का प्रकार) <span className="text-[#C62828]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Other'] as AnimalType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`p-2.5 rounded-[2px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                        animalType === type
                          ? 'border-[#1B5E3C] bg-[#EBF5EE] text-[#1B5E3C]'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <AnimalIcon type={type} className="w-5 h-5" />
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breed */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Breed (नस्ल)
                  </label>
                  <select
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                  >
                    {(COMMON_BREEDS[animalType] || []).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="Other / Non-Descript">Other / Non-Descript</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                    Gender (लिंग) <span className="text-[#C62828]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center justify-center gap-2 p-2 border rounded-[2px] text-xs font-bold cursor-pointer transition-colors ${
                      gender === 'Female' ? 'border-[#1B5E3C] bg-[#EBF5EE] text-[#1B5E3C]' : 'border-stone-300 bg-white text-stone-700'
                    }`}>
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={gender === 'Female'}
                        onChange={() => setGender('Female')}
                        className="sr-only"
                      />
                      <span>मादा / Female</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 p-2 border rounded-[2px] text-xs font-bold cursor-pointer transition-colors ${
                      gender === 'Male' ? 'border-[#1B5E3C] bg-[#EBF5EE] text-[#1B5E3C]' : 'border-stone-300 bg-white text-stone-700'
                    }`}>
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={gender === 'Male'}
                        onChange={() => setGender('Male')}
                        className="sr-only"
                      />
                      <span>नर / Male</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Vitals & Markings */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono border-b border-stone-200 pb-2">
              2. PHYSICAL CHARACTERISTICS & VITALS &middot; शारीरिक विवरण
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Approximate Age (Years) / आयु
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.5"
                  value={age}
                  onChange={(e) => setAge(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs font-mono text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Body Weight (kg) / वजन
                </label>
                <input
                  type="number"
                  min="1"
                  max="1500"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 380"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs font-mono text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Color / Distinguishing Marks
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Red with white forehead spot"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Date of Birth (if known)
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full sm:w-1/3 px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs font-mono text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geolocation & Health Status on Registration */}
          <div className="bg-white border border-stone-300 p-4 rounded-[2px] shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono border-b border-stone-200 pb-2">
              3. RESIDENCE LOCATION & BASELINE HEALTH &middot; स्थान एवं प्रारंभिक स्वास्थ्य
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Village (गाँव)
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  District (जिला)
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 font-sans">
                  Baseline Health Status
                </label>
                <select
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value as AnimalHealthStatus)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-[2px] text-xs text-stone-800 focus:outline-none focus:border-[#1B5E3C]"
                >
                  <option value="Healthy">Healthy (स्वस्थ - सामान्य)</option>
                  <option value="Under Observation">Under Observation (निगरानी)</option>
                  <option value="High Risk">High Risk (अस्वस्थ / जोखिम)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="p-4 bg-white border border-stone-300 rounded-[2px] shadow-xs flex items-center justify-between gap-3">
            <p className="text-[11px] text-stone-500 font-sans">
              Recorded in the National Animal Health Passport Database.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/farmer/animals')}
                className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-[2px] transition-colors cursor-pointer"
              >
                रद्द करें / Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5E3C] hover:bg-[#123C2A] text-white text-xs font-bold rounded-[2px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'पंजीकरण जारी है...' : 'पशु पंजीकृत करें · REGISTER ANIMAL'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
