import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '@/contexts/LanguageContext'
import { ArrowLeft, Blocks, Hammer, Zap, Paintbrush, HandHelping, Wrench, Camera, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

const skillOptions = [
  { key: 'mason', icon: Blocks },
  { key: 'carpenter', icon: Hammer },
  { key: 'electrician', icon: Zap },
  { key: 'painter', icon: Paintbrush },
  { key: 'helper', icon: HandHelping },
  { key: 'plumber', icon: Wrench },
]

const subSkillMap: Record<string, string[]> = {
  mason: ['Bricklaying', 'Plastering', 'Tiling'],
  carpenter: ['Furniture', 'Shuttering', 'Door/Window'],
  electrician: ['Wiring', 'Panel Work', 'Repair'],
  painter: ['Interior', 'Exterior', 'Texture'],
  helper: ['Loading', 'Mixing', 'Cleaning'],
  plumber: ['Pipe Fitting', 'Drainage', 'Repair'],
}

const CreateProject = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [projectTitle, setProjectTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [skillType, setSkillType] = useState('')
  const [subSkill, setSubSkill] = useState('')
  const [workerCount, setWorkerCount] = useState(1)
  const [wage, setWage] = useState('')
  const [food, setFood] = useState(false)
  const [accommodation, setAccommodation] = useState(false)
  const [insurance, setInsurance] = useState(false)
  const [pf, setPf] = useState(false)
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('geolocationNotSupported') || 'Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          if (res.data && res.data.address) {
            const city = res.data.address.city || res.data.address.town || res.data.address.village || res.data.address.county || '';
            const state = res.data.address.state || '';
            setLocation(city ? `${city}, ${state}` : res.data.display_name.split(',').slice(0, 2).join(', '));
          }
        } catch (error) {
          console.error("Geocoding failed", error);
          alert('Failed to automatically fetch city. Please type it.');
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        console.error(error);
        if (error.code === 1) alert('Please allow location permissions.');
        else alert('Failed to retrieve location');
        setGeoLoading(false);
      }
    );
  };

  const totalSteps = 5
  const progress = ((step + 1) / totalSteps) * 100

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remaining = 3 - images.length
    const toProcess = Array.from(files).slice(0, remaining)

    setImagesLoading(true)

    toProcess.forEach((file) => {
      const reader = new FileReader()

      reader.onload = (ev) => {
        const img = new Image()

        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 800

          let w = img.width
          let h = img.height

          if (w > maxSize || h > maxSize) {
            if (w > h) {
              h = (h / w) * maxSize
              w = maxSize
            } else {
              w = (w / h) * maxSize
              h = maxSize
            }
          }

          canvas.width = w
          canvas.height = h

          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)

          const compressed = canvas.toDataURL('image/jpeg', 0.7)

          setImages((prev) => [...prev, compressed].slice(0, 3))
          setImagesLoading(false)
        }

        img.src = ev.target?.result as string
      }

      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const canNext = () => {
    if (step === 0) return projectTitle && location && startDate
    if (step === 1) return skillType && wage
    return true
  }

  const handleNext = async () => {

    if (step < totalSteps - 1) {
      setStep(step + 1)
      return
    }

    try {

      setLoading(true)

      const token = localStorage.getItem("token")

      const res = await axios.post(
        "http://localhost:5001/api/projects/create",
        {
          projectTitle,
          location,
          startDate,
          skillType,
          subSkill,
          workerCount,
          wage,
          food,
          accommodation,
          insurance,
          pf,
          description,
          images
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data.success) {
        alert("Project created successfully")
        navigate("/contractor-dashboard")
      }

    } catch (error: any) {

      console.log(error)

      alert(
        error.response?.data?.message ||
        "Failed to create project"
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">

      <button
        onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
        className="mb-4 flex items-center gap-2 text-lg text-accent"
      >
        <ArrowLeft className="h-6 w-6" /> {t('back')}
      </button>

      <h1 className="mb-2 text-2xl font-bold">{t('createProject')}</h1>

      <Progress value={progress} className="mb-8 h-3" />

      <div className="flex flex-1 flex-col">
        {/* Step 0: Project Details */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-xl font-medium">{t('projectTitle')}</label>
              <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder={t('enterProjectName')} className="h-14 rounded-xl text-lg" />
            </div>
            <div>
              <label className="mb-3 block text-xl font-medium">{t('location')}</label>
              <div className="relative flex items-center gap-2">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('enterCity')} className="h-14 flex-1 rounded-xl text-lg" />
                <Button 
                  onClick={fetchCurrentLocation} 
                  disabled={geoLoading} 
                  variant="outline" 
                  className="h-14 px-4 rounded-xl flex items-center gap-2"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="hidden sm:inline">{geoLoading ? 'Detecting...' : 'Detect'}</span>
                </Button>
              </div>
            </div>
            <div>
              <label className="mb-3 block text-xl font-medium">{t('startDate')}</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-14 rounded-xl text-lg" />
            </div>
          </div>
        )}

        {/* Step 1: Worker Requirement */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-xl font-medium">{t('skillType')}</label>
              <div className="grid grid-cols-3 gap-3">
                {skillOptions.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setSkillType(key); setSubSkill(''); }}
                    className={`flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all active:scale-95 ${
                      skillType === key ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card text-card-foreground'
                    }`}
                  >
                    <Icon className="mb-1 h-7 w-7" />
                    <span className="text-sm font-semibold">{t(key)}</span>
                  </button>
                ))}
              </div>
            </div>
            {skillType && subSkillMap[skillType] && (
              <div>
                <label className="mb-3 block text-xl font-medium">{t('subSkill')}</label>
                <div className="flex flex-wrap gap-2">
                  {subSkillMap[skillType].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubSkill(s)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        subSkill === s ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="mb-3 block text-xl font-medium">{t('numberOfWorkers')}</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setWorkerCount(Math.max(1, workerCount - 1))} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-xl font-bold text-accent">-</button>
                <span className="text-3xl font-bold text-foreground">{workerCount}</span>
                <button onClick={() => setWorkerCount(workerCount + 1)} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-xl font-bold text-accent">+</button>
              </div>
            </div>
            <div>
              <label className="mb-3 block text-xl font-medium">{t('dailyWage')} (₹)</label>
              <Input type="number" value={wage} onChange={(e) => setWage(e.target.value)} placeholder="₹500" className="h-14 rounded-xl text-lg" />
            </div>
          </div>
        )}

        {/* Step 2: Facilities */}
        {step === 2 && (
          <div className="space-y-5">
            <label className="mb-2 block text-xl font-medium">{t('facilities')}</label>
            {[
              { label: t('food'), value: food, set: setFood },
              { label: t('accommodation'), value: accommodation, set: setAccommodation },
              { label: t('insurance'), value: insurance, set: setInsurance },
              { label: t('pf'), value: pf, set: setPf },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <span className="text-lg font-semibold">{label}</span>
                <Switch checked={value} onCheckedChange={set} />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Job Description & Images */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-xl font-medium">{t('jobDescription')}</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('enterDescription')}
                className="min-h-[120px] rounded-xl text-lg"
              />
            </div>
            <div>
              <label className="mb-3 block text-xl font-medium">{t('uploadImages')}</label>
              <p className="mb-3 text-sm text-muted-foreground">{t('uploadImageHint')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {imagesLoading && (
                  <Skeleton className="aspect-square rounded-xl" />
                )}
                {images.length < 3 && !imagesLoading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent text-accent"
                  >
                    <Camera className="h-8 w-8" />
                    <span className="mt-1 text-xs font-semibold">+</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div>
            <h2 className="mb-4 text-xl font-bold">{t('projectSummary')}</h2>
            <Card className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div><span className="font-semibold">{t('projectTitle')}:</span> {projectTitle}</div>
                <div><span className="font-semibold">{t('location')}:</span> {location}</div>
                <div><span className="font-semibold">{t('startDate')}:</span> {startDate}</div>
                <div><span className="font-semibold">{t('skillType')}:</span> {t(skillType)} {subSkill && `- ${subSkill}`}</div>
                <div><span className="font-semibold">{t('numberOfWorkers')}:</span> {workerCount}</div>
                <div><span className="font-semibold">{t('dailyWage')}:</span> ₹{wage}{t('perDay')}</div>
                <div className="flex flex-wrap gap-2">
                  {food && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">🍽️ {t('food')}</span>}
                  {accommodation && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">🏠 {t('accommodation')}</span>}
                  {insurance && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">🛡️ {t('insurance')}</span>}
                  {pf && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">💰 {t('pf')}</span>}
                </div>
                {description && <div><span className="font-semibold">{t('jobDescription')}:</span> {description}</div>}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="aspect-square rounded-lg object-cover" loading="lazy" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Button onClick={handleNext} disabled={!canNext()} className="mt-8 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90" size="lg">
        {step < totalSteps - 1 ? t('next') : t('postProject')}
      </Button>
    </div>
  );
};

export default CreateProject;
