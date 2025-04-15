import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
// const _serviceName: string = 'AuthService';
@Injectable()
export class AuthService {
  constructor(
    readonly configService: ConfigService,
    readonly jwtService: JwtService,
  ) { }
  //Mock data
  private users: User[] = [];
  private id_number: number = 1;

  async signup(email: string, password: string, role: "user" | "rental"): Promise<{ user: User, token: string }> {
    const existing_user = this.users.find((user) => user.email === email);
    if (existing_user) throw new Error("Email already exists!");

    const new_user: User = {
      id: this.id_number++,
      email,
      password,
      role
    };
    this.users.push(new_user);

    const payload = {
      id: new_user.id,
      email: new_user.email,
      role: new_user.role
    };
    const token = this.jwtService.sign(payload);
    return { user: new_user, token };
  }

  async login(email: string, password: string): Promise<{ user: User, token: string }> {
    const user = this.users.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) return null;
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);
    return { user, token };
  }
}
