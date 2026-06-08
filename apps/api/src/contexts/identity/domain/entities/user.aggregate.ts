import { Email } from '@src/contexts/identity/domain/value-objects/email.vo';
import { UserId } from '@src/contexts/identity/domain/value-objects/user-id.vo';
import { UserRole } from '@src/contexts/identity/domain/value-objects/user-role.vo';

export interface UserProps {
  id: UserId;
  email: Email;
  passwordHash: string;
  displayName: string;
  role: UserRole;
}

export class User {
  readonly id: UserId;
  readonly email: Email;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly role: UserRole;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.displayName = props.displayName;
    this.role = props.role;
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }
}
