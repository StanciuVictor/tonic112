import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  const dbUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '',
    isAdmin: false,
    canCreateParty: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    dbUser.passwordHash = await bcrypt.hash('correct-password', 10);

    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      await expect(
        service.register({ email: dbUser.email, password: 'x', name: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password before storing it and never returns it', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...dbUser, ...data, id: 'new-user' }),
      );

      const result = await service.register({
        email: 'new@example.com',
        password: 'plain-text-password',
        name: 'New User',
      });

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('plain-text-password');
      expect(
        await bcrypt.compare('plain-text-password', createdData.passwordHash),
      ).toBe(true);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('signed-jwt');
    });

    it('never lets isAdmin/canCreateParty be set from the request', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...dbUser, ...data, id: 'new-user' }),
      );

      await service.register({
        email: 'new@example.com',
        password: 'plain-text-password',
        name: 'New User',
      });

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.isAdmin).toBeUndefined();
      expect(createdData.canCreateParty).toBeUndefined();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      await expect(
        service.login({ email: dbUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a signed JWT and the user on correct credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.login({
        email: dbUser.email,
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user.id).toBe(dbUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: dbUser.id,
        isAdmin: dbUser.isAdmin,
        canCreateParty: dbUser.canCreateParty,
      });
    });
  });

  describe('me', () => {
    it('returns the current user', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.me(dbUser.id);

      expect(result).toEqual({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isAdmin: dbUser.isAdmin,
        canCreateParty: dbUser.canCreateParty,
      });
    });

    it('rejects when the user no longer exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.me('deleted-user')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
