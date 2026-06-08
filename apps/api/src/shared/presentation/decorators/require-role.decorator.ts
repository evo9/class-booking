import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLE = 'required_role';
export const RequireRole = (role: 'admin' | 'attendee') =>
  SetMetadata(REQUIRED_ROLE, role);
