export interface WorkerProject {
  id: string;
  title: string;
  contractorName: string;
  location: string;
  wage: number;
  durationDays?: number | null;
  image?: string;
  images: string[];
  facilities: {
    food: boolean;
    accommodation: boolean;
    insurance: boolean;
  };
  applicationStatus?: string;
  raw: any;
}

export interface WorkerProfileData {
  id?: string;
  name: string;
  skills: string[];
  experience: number;
  city: string;
  expectedWage: number;
  reviews: any[];
  raw: any;
}

export const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

export const getProjectId = (project: any) => {
  return project?._id || project?.id || '';
};

export const normalizeProject = (project: any): WorkerProject => {
  const facilities = project?.facilities || {};

  return {
    id: getProjectId(project),
    title: project?.projectTitle || project?.title || 'Untitled Project',
    contractorName:
      project?.contractorId?.company ||
      project?.contractorId?.name ||
      project?.contractor ||
      '',
    location: project?.location || '',
    wage: Number(project?.wage || 0),
    durationDays: project?.duration ?? null,
    image: project?.images?.[0] || project?.image,
    images: Array.isArray(project?.images) ? project.images : project?.image ? [project.image] : [],
    facilities: {
      food: Boolean(facilities.food || project?.food),
      accommodation: Boolean(facilities.accommodation || project?.accommodation),
      insurance: Boolean(facilities.insurance || project?.insurance),
    },
    applicationStatus: project?.applicationStatus,
    raw: project,
  };
};

export const normalizeProjects = (projects: any[] = []) => {
  return projects.map(normalizeProject).filter((project) => project.id);
};

export const normalizeProfile = (profile: any): WorkerProfileData => {
  return {
    id: profile?._id || profile?.id,
    name: profile?.name || profile?.userId?.name || '',
    skills: Array.isArray(profile?.skills) ? profile.skills : [],
    experience: Number(profile?.experience || 0),
    city: profile?.city || profile?.userId?.location || '',
    expectedWage: Number(profile?.expectedWage || profile?.wage || 0),
    reviews: Array.isArray(profile?.reviews) ? profile.reviews : [],
    raw: profile,
  };
};
