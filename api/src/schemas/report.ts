export interface ReportData {
  bookingId: string;
  serviceName: string;
  categoryId: string;
  completedAt: string;
  warrantyExpiresAt: string;
  nextServiceRecommendation: string;
  technician: { id: string; name: string; rating: number };
  customer: { email: string; displayName: string };
  priceBreakdown: {
    baseAmount: number;
    approvedAddOns: Array<{ name: string; price: number }>;
    finalAmount: number;
  };
}

export interface PhotoSet {
  stage: string;
  photos: Buffer[];
}
