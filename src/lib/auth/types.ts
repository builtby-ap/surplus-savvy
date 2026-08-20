export type UserRole = "customer" | "vendor" | "admin";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type AuthProviderId = "password" | "google";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  provider: AuthProviderId;
  /** Only present for vendor accounts. */
  vendorId?: string;
}

export interface VendorDocumentMeta {
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "submitted";
}

export interface VendorApplication {
  id: string;
  cafeName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  businessLicense: VendorDocumentMeta;
  fdaApproval: VendorDocumentMeta;
  role: "vendor";
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  submittedAt: string;
}

export interface CustomerRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface VendorRegistrationInput {
  cafeName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  password: string;
  businessLicense: VendorDocumentMeta;
  fdaApproval: VendorDocumentMeta;
}

export interface AuthSession {
  user: AuthUser;
  vendorApplication?: VendorApplication;
}
