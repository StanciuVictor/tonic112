import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthFlag,
  REQUIRE_FLAGS_KEY,
} from '../decorators/require-flags.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class FlagsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFlags = this.reflector.getAllAndOverride<AuthFlag[]>(
      REQUIRE_FLAGS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFlags || requiredFlags.length === 0) {
      return true;
    }

    const user: JwtPayload | undefined = context
      .switchToHttp()
      .getRequest().user;

    const hasAllRequiredFlags =
      !!user && requiredFlags.every((flag) => user[flag] === true);

    if (!hasAllRequiredFlags) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
