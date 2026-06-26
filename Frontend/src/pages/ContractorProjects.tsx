import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import axios from 'axios'
import { Card, CardContent } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'
import { MapPin, Users } from 'lucide-react'

interface Project {
  _id: string
  projectTitle: string
  description?: string
  location: string
  workerCount: number
  status: string
  startDate?: string
  images?: string[]
  facilities?: {
    food?: boolean
    accommodation?: boolean
    insurance?: boolean
    pf?: boolean
  }
}

const ContractorProjects = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.get('https://rozgarsetu-niht.onrender.com/api/projects/contractor-projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.data.success) {
        setProjects(res.data.projects)
      }
    } catch (error) {
      console.error('Error fetching contractor projects', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectStatus = async (projectId: string, status: 'open' | 'closed') => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(
        `https://rozgarsetu-niht.onrender.com/api/projects/${projectId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data.success) {
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? res.data.project : p)),
        )
      }
    } catch (error) {
      console.error('Error updating project status', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`https://rozgarsetu-niht.onrender.com/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setProjects((prev) => prev.filter((p) => p._id !== projectId))
    } catch (error) {
      console.error('Error deleting project', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="bg-primary px-6 pb-8 pt-8">
        <h1 className="text-2xl font-bold text-primary-foreground">
          {t('projects')}
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('projectsSubtitle')}</p>
      </div>

      <div className="px-6 -mt-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Card key={idx} className="animate-pulse rounded-2xl">
                <CardContent className="h-24" />
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            {t('noProjectsFound')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <Card key={project._id} className="rounded-2xl">
                <CardContent className="p-5">
                  {project.images && project.images.length > 0 && (
                    <img
                      src={project.images[0]}
                      alt={project.projectTitle}
                      className="mb-4 h-40 w-full rounded-2xl object-cover"
                    />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{project.projectTitle}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {project.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.workerCount} {t('workers')}
                        </span>
                      </div>

                      {project.facilities && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {project.facilities.food && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t('food')}</span>
                          )}
                          {project.facilities.accommodation && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t('accommodation')}</span>
                          )}
                          {project.facilities.insurance && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t('insurance')}</span>
                          )}
                          {project.facilities.pf && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{t('pf')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          project.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {project.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/contractor-projects/${project._id}/applicants`)}
                          className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          {t('viewApplications')}
                        </button>
                        {project.status === 'open' && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('confirmCloseProject'))) {
                                updateProjectStatus(project._id, 'closed')
                              }
                            }}
                            className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                          >
                            {t('close')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(t('confirmDeleteProject'))) {
                              deleteProject(project._id)
                            }
                          }}
                          className="rounded-full border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/create-project')}
          className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-center text-base font-semibold text-accent-foreground hover:bg-accent/90"
        >
          {t('createProject')}
        </button>
      </div>

      <BottomNav type="contractor" active="projects" />
    </div>
  )
}

export default ContractorProjects
