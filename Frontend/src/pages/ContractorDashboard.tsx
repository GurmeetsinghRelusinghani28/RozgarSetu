// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { FolderOpen, Users, Clock, Plus, MapPin, ClipboardCheck, ArrowLeft } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import BottomNav from '@/components/BottomNav';

// const mockProjects = [
//   { id: 1, name: 'Metro Station Phase 2', location: 'Delhi', workers: 25, status: 'Active' },
//   { id: 2, name: 'Villa Construction', location: 'Noida', workers: 12, status: 'Active' },
//   { id: 3, name: 'Office Renovation', location: 'Gurgaon', workers: 8, status: 'Pending' },
// ];

// const ContractorDashboard = () => {
//   const navigate = useNavigate();
//   const { t } = useLanguage();

//   return (
//     <div className="flex min-h-screen flex-col bg-background pb-24">
//       <div className="bg-accent px-6 pb-8 pt-8">
//         <button onClick={() => navigate('/user-type')} className="mb-3 flex items-center gap-2 text-base text-accent-foreground/80">
//           <ArrowLeft className="h-5 w-5" /> {t('back')}
//         </button>
//         <h1 className="text-2xl font-bold text-accent-foreground">{t('hello')}, अमित जी 👋</h1>
//       </div>

//       <div className="px-6 -mt-4">
//         <div className="grid grid-cols-3 gap-3">
//           <Card className="rounded-2xl">
//             <CardContent className="flex flex-col items-center p-4">
//               <FolderOpen className="mb-1 h-7 w-7 text-accent" />
//               <span className="text-2xl font-bold text-foreground">3</span>
//               <span className="text-xs text-muted-foreground text-center">{t('activeProjects')}</span>
//             </CardContent>
//           </Card>
//           <Card className="rounded-2xl">
//             <CardContent className="flex flex-col items-center p-4">
//               <Users className="mb-1 h-7 w-7 text-primary" />
//               <span className="text-2xl font-bold text-foreground">45</span>
//               <span className="text-xs text-muted-foreground text-center">{t('workersHired')}</span>
//             </CardContent>
//           </Card>
//           <Card className="rounded-2xl">
//             <CardContent className="flex flex-col items-center p-4">
//               <Clock className="mb-1 h-7 w-7 text-destructive" />
//               <span className="text-2xl font-bold text-foreground">8</span>
//               <span className="text-xs text-muted-foreground text-center">{t('pendingRequests')}</span>
//             </CardContent>
//           </Card>
//         </div>

//         <Button onClick={() => navigate('/create-project')} className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90" size="lg">
//           <Plus className="mr-2 h-6 w-6" /> {t('createProject')}
//         </Button>

//         <Button onClick={() => navigate('/worker-applications')} variant="outline" className="mt-3 h-14 w-full rounded-2xl text-xl font-bold" size="lg">
//           <ClipboardCheck className="mr-2 h-6 w-6" /> {t('viewApplications')}
//         </Button>

//         <h2 className="mb-4 mt-8 text-xl font-bold text-foreground">{t('activeProjects')}</h2>
//         <div className="flex flex-col gap-4">
//           {mockProjects.map((project) => (
//             <Card key={project.id} className="rounded-2xl">
//               <CardContent className="p-5">
//                 <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
//                 <div className="mt-3 flex flex-wrap gap-3">
//                   <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {project.location}</span>
//                   <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /> {project.workers} {t('workers')}</span>
//                   <span className={`rounded-full px-3 py-1 text-xs font-semibold ${project.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{project.status}</span>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//       <BottomNav type="contractor" active="home" />
//     </div>
//   );
// };

// export default ContractorDashboard;


import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useState } from 'react'
import axios from 'axios'

import {
  FolderOpen,
  Users,
  Clock,
  Plus,
  MapPin,
  ClipboardCheck,
  ArrowLeft
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import BottomNav from '@/components/BottomNav'

interface Project {
  _id: string
  projectTitle: string
  location: string
  workerCount: number
  status: string
}

const ContractorDashboard = () => {

  const navigate = useNavigate()
  const { t } = useLanguage()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {

    try {

      const token = localStorage.getItem("token")

      const res = await axios.get(
        "http://localhost:5001/api/projects/contractor-projects",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (res.data.success) {
        setProjects(res.data.projects)
      }

    } catch (error) {
      console.log("Error fetching projects", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const activeProjects = projects.filter(p => p.status === "Active").length

  const totalWorkers = projects.reduce(
    (sum, p) => sum + (p.workerCount || 0),
    0
  )

  return (

    <div className="flex min-h-screen flex-col bg-background pb-24">

      {/* HEADER */}

      <div className="bg-accent px-6 pb-8 pt-8">

        <button
          onClick={() => navigate('/user-type')}
          className="mb-3 flex items-center gap-2 text-base text-accent-foreground/80"
        >
          <ArrowLeft className="h-5 w-5" /> {t('back')}
        </button>

        <h1 className="text-2xl font-bold text-accent-foreground">
          {t('hello')} 👋
        </h1>

      </div>

      <div className="px-6 -mt-4">

        {/* STATS */}

        <div className="grid grid-cols-3 gap-3">

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center p-4">
              <FolderOpen className="mb-1 h-7 w-7 text-accent" />
              <span className="text-2xl font-bold">{activeProjects}</span>
              <span className="text-xs text-muted-foreground text-center">
                {t('activeProjects')}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center p-4">
              <Users className="mb-1 h-7 w-7 text-primary" />
              <span className="text-2xl font-bold">{totalWorkers}</span>
              <span className="text-xs text-muted-foreground text-center">
                {t('workersHired')}
              </span>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center p-4">
              <Clock className="mb-1 h-7 w-7 text-destructive" />
              <span className="text-2xl font-bold">0</span>
              <span className="text-xs text-muted-foreground text-center">
                {t('pendingRequests')}
              </span>
            </CardContent>
          </Card>

        </div>

        {/* BUTTONS */}

        <Button
          onClick={() => navigate('/create-project')}
          className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          <Plus className="mr-2 h-6 w-6" /> {t('createProject')}
        </Button>

        <Button
          onClick={() => navigate('/worker-applications')}
          variant="outline"
          className="mt-3 h-14 w-full rounded-2xl text-xl font-bold"
          size="lg"
        >
          <ClipboardCheck className="mr-2 h-6 w-6" /> {t('viewApplications')}
        </Button>

        {/* PROJECT LIST */}

        <h2 className="mb-4 mt-8 text-xl font-bold">
          {t('activeProjects')}
        </h2>

        <div className="flex flex-col gap-4">

          {loading && (
            <p className="text-center text-muted-foreground">
              Loading projects...
            </p>
          )}

          {!loading && projects.length === 0 && (
            <p className="text-center text-muted-foreground">
              No projects yet
            </p>
          )}

          {projects.map((project) => (

            <Card key={project._id} className="rounded-2xl">

              <CardContent className="p-5">

                <h3 className="text-lg font-bold">
                  {project.projectTitle}
                </h3>

                <div className="mt-3 flex flex-wrap gap-3">

                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </span>

                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {project.workerCount} {t('workers')}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      project.status === 'Active'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {project.status || "Active"}
                  </span>

                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      </div>

      <BottomNav type="contractor" active="home" />

    </div>
  )
}

export default ContractorDashboard