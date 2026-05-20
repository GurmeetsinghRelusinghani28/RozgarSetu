import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'
import { Search, User, Star } from 'lucide-react'
import axios from 'axios'

interface Worker {
  id: string
  name: string
  skills: string[]
  rating: number
  location: string
  experience: number
  phone: string
}

const ContractorWorkers = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const params: Record<string, string> = {}
      if (search.trim()) params.search = search.trim()

      const res = await axios.get('http://localhost:5001/api/projects/workers', {
        headers: { Authorization: `Bearer ${token}` },
        params
      })

      if (res.data?.success) {
        setWorkers(res.data.workers || [])
      } else {
        setError(res.data?.message || 'Failed to load workers')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [search])

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <h1 className="text-2xl font-bold text-primary-foreground">
          {t('workers')}
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('workersSubtitle')}</p>
      </div>

      <div className="px-6 -mt-4">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchWorkers')}
            className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <span className="text-lg font-semibold">{t('loading')}...</span>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 p-8 text-center text-sm text-destructive">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            {t('noWorkersFound')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((worker) => (
              <Card key={worker.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">{worker.name}</h2>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {worker.skills.map((skill) => (
                              <span key={skill} className="rounded-full bg-primary/10 px-2 py-1">
                                {t(skill)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-yellow-500" /> {worker.rating.toFixed(1)}
                      </div>
                      <button
                        onClick={() => navigate(`/worker-profile/${worker.id}`)}
                        className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                      >
                        {t('viewProfile')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">{t('experience')}:</span> {worker.experience} {t('years')}
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">{t('location')}:</span> {worker.location}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav type="contractor" active="workers" />
    </div>
  )
}

export default ContractorWorkers
