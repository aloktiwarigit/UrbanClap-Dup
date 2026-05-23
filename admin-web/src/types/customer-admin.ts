export type CustomerStatus = 'ACTIVE' | 'FLAGGED';

export interface RecentBooking {
  date: string;
  service: string;
  techName: string;
  status: string;
}

export interface RecentComplaint {
  date: string;
  category: string;
  resolution: string;
}

export interface CustomerNote {
  text: string;
  createdAt: string;
  authorName: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  city: string;
  bookingCount: number;
  lastBookingDate?: string;
  accountStatus: CustomerStatus;
  openComplaintCount: number;
  recentBookings: RecentBooking[];
  recentComplaints: RecentComplaint[];
  notes: CustomerNote[];
}

export interface AdminCustomerListResponse {
  customers: AdminCustomer[];
}
