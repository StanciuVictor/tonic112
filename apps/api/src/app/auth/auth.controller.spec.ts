import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock; me: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn(), me: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delegates registration to AuthService', async () => {
    const dto: RegisterDto = {
      email: 'a@example.com',
      password: 'Passw0rd!',
      name: 'A',
    };
    const response = { accessToken: 'signed-jwt', user: { id: 'user-1' } };
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toBe(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to AuthService', async () => {
    const dto: LoginDto = { email: 'a@example.com', password: 'Passw0rd!' };
    const response = { accessToken: 'signed-jwt', user: { id: 'user-1' } };
    authService.login.mockResolvedValue(response);

    await expect(controller.login(dto)).resolves.toBe(response);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates me to AuthService using the current user id from the token', async () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      isAdmin: false,
      canCreateParty: false,
    };
    const authUser = {
      id: 'user-1',
      email: 'a@example.com',
      name: 'A',
      isAdmin: false,
      canCreateParty: false,
    };
    authService.me.mockResolvedValue(authUser);

    await expect(controller.me(payload)).resolves.toBe(authUser);
    expect(authService.me).toHaveBeenCalledWith('user-1');
  });
});
