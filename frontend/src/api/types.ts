export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface LoginResponse {
  token: string;
  /** Có từ API login; bản lưu cũ có thể thiếu — cần đăng nhập lại. */
  userId?: number;
  username: string;
  fullName: string;
  role: Role;
  departmentId: number | null;
  departmentName: string | null;
  features: string[];
}

export interface Department {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

export interface User {
  id: number;
  employeeCode: string;
  username: string;
  fullName: string;
  role: Role;
  departmentId: number | null;
  departmentName: string | null;
  features: string[];
  readOnlyProfile: boolean;
}

export interface FeatureOption {
  code: string;
  name: string;
}

export interface FeatureAdmin {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

export interface PermissionRequest {
  id: number;
  code: string;
  title: string;
  description: string | null;
  status: string;
  requesterId: number;
  requesterName: string;
  targetUserId: number;
  targetUserName: string;
  /** null nếu NV chưa gán phòng; thiếu field nếu client cũ. */
  targetDepartmentId?: number | null;
  targetDepartmentName: string | null;
  requestedFeatureCodes: string[];
  reviewerId: number | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}
