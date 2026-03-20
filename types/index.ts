export type UserRole = "super_admin" | "admin" | "employee";

export type SpielStatus = "active" | "archived";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  companyId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Department = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Spiel = {
  id: string;
  companyId: string;
  departmentId: string;
  categoryId: string | null;
  createdByUserId: string;
  title: string;
  description: string | null;
  contentJson: string | null;
  contentHtml: string | null;
  contentPlain: string | null;
  status: SpielStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SpielWithRelations = Spiel & {
  department: Pick<Department, "id" | "name">;
  category: Pick<Category, "id" | "name"> | null;
  createdBy: Pick<AppUser, "id" | "name">;
};

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};
