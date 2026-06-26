import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react'

interface ContractorProfileData {
  name: string
  phone: string
  email?: string
  company?: string
  location?: string
  established?: number
  projectsCompleted?: number
  rating?: number
}

const ContractorProfile = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [profile, setProfile] = useState<ContractorProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get('https://rozgarsetu-niht.onrender.com/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setProfile(res.data.user)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
    } catch (error) {
      console.error('Error fetching profile', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const payload = {
        name: profile.name,
        email: profile.email,
        company: profile.company,
        location: profile.location,
        established: profile.established,
        projectsCompleted: profile.projectsCompleted
      }

      const res = await axios.put('https://rozgarsetu-niht.onrender.com/api/auth/profile', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setProfile(res.data.user)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        toast({ title: t('profileUpdated'), description: '' })
      }
    } catch (error) {
      console.error('Error saving profile', error)
      toast({ title: t('profileUpdated'), description: 'Unable to save profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <button
          onClick={() => navigate('/contractor-dashboard')}
          className="mb-3 flex items-center gap-2 text-base text-primary-foreground/80"
        >
          <ArrowLeft className="h-5 w-5" /> {t('back')}
        </button>
        <h1 className="text-2xl font-bold text-primary-foreground">{t('profile')}</h1>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('profileSubtitle')}</p>
      </div>

      <div className="px-6 -mt-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="grid gap-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('yourName')}</label>
                  <Input
                    value={profile?.name || ''}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                    placeholder={t('enterName')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('company')}</label>
                  <Input
                    value={profile?.company || ''}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, company: e.target.value } : prev))}
                    placeholder={t('company')}
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('phone')}</label>
                  <Input value={profile?.phone || ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('email')}</label>
                  <Input
                    type="email"
                    value={profile?.email || ''}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                    placeholder={t('email')}
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('location')}</label>
                  <Input
                    value={profile?.location || ''}
                    onChange={(e) => setProfile((prev) => (prev ? { ...prev, location: e.target.value } : prev))}
                    placeholder={t('city')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('established')}</label>
                  <Input
                    type="number"
                    value={profile?.established ?? ''}
                    onChange={(e) =>
                      setProfile((prev) =>
                        prev
                          ? { ...prev, established: e.target.value ? Number(e.target.value) : undefined }
                          : prev,
                      )
                    }
                    placeholder="2023"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('projectsCompleted')}</label>
                  <Input
                    type="number"
                    value={profile?.projectsCompleted ?? ''}
                    onChange={(e) =>
                      setProfile((prev) =>
                        prev
                          ? { ...prev, projectsCompleted: e.target.value ? Number(e.target.value) : undefined }
                          : prev,
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('rating')}</label>
                  <Input value={profile?.rating?.toString() ?? ''} disabled />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || loading || !profile}
                className="mt-4 h-12 w-full rounded-2xl bg-accent text-lg font-bold text-accent-foreground hover:bg-accent/90"
              >
                {saving ? `${t('save')}...` : t('save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav type="contractor" active="profile" />
    </div>
  )
}

export default ContractorProfile
