export type UserRole = "admin" | "partner";

export type UserProfile = {
  email: string;
  role: UserRole;
  /** לשותף: ערך utm_source לסינון; לאדמין יכול להישאר ריק */
  utmSource: string;
  approved: boolean;
};
