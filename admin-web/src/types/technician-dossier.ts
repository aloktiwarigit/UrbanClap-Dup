export interface TechnicianReview {
  rating: number;
  text: string;
  date: string;
}

export interface TechnicianDossier {
  id: string;
  displayName: string;
  photoUrl?: string;
  verifiedAadhaar: boolean;
  verifiedPoliceCheck: boolean;
  trainingInstitution?: string;
  certifications: string[];
  languages: string[];
  yearsInService: number;
  totalJobsCompleted: number;
  lastReviews: TechnicianReview[];
}
