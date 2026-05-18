import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';
import { ApiError } from '../errors/ApiError';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import type { IAuthResponse, IAuthTokenPayload, IUserPublic } from '../interfaces/IUser';
import type { LoginInput, RefreshTokenInput, RegisterInput } from '../validators/auth.validation';
import { USER_ROLES, type UserRole } from '../constants/auth.constants';

type JwtExpiresIn = jwt.SignOptions['expiresIn'];

type PersistedUser = {
  _id: { toString: () => string };
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  organizationId: { toString: () => string };
  createdAt: Date;
  updatedAt: Date;
};

const SALT_ROUNDS = 12;

const toUserPublic = (user: PersistedUser): IUserPublic => {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    organizationId: user.organizationId.toString(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const logAuthError = (context: string, error: unknown): void => {
  logger.error(context);
  console.error(error);

  if (typeof error === 'object' && error !== null && 'errors' in error) {
    Object.values((error as { errors?: Record<string, { path?: string; message?: string }> }).errors ?? {}).forEach((issue) => {
      console.log(issue.path, issue.message);
    });
  }
};

class AuthService {
  private readonly accessTokenSecret: string = env.JWT_SECRET;

  private readonly refreshTokenSecret: string = env.REFRESH_TOKEN_SECRET;

  private generateAccessToken(payload: IAuthTokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: env.JWT_EXPIRES_IN as JwtExpiresIn,
    });
  }

  private generateRefreshToken(payload: IAuthTokenPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as JwtExpiresIn,
    });
  }

  private buildAuthResponse(user: PersistedUser): IAuthResponse {
    const payload: IAuthTokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    };

    return {
      user: toUserPublic(user),
      tokens: {
        accessToken: this.generateAccessToken(payload),
        refreshToken: this.generateRefreshToken(payload),
      },
    };
  }

  async register(input: RegisterInput): Promise<IAuthResponse> {
    try {
      const email = input.email.toLowerCase();

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw new ApiError('User with this email already exists', 409);
      }

      const role = input.role ?? USER_ROLES.SALES_USER;
      let organizationId = input.organizationId;

      if (!organizationId) {
        if (role === USER_ROLES.ADMIN) {
          const org = await Organization.create({ name: `${input.fullName}'s Workspace` });
          organizationId = org._id.toString();
        } else {
          const existingOrg = await Organization.findOne();
          if (existingOrg) {
            organizationId = existingOrg._id.toString();
          } else {
            const defaultOrg = await Organization.create({ name: 'Default Workspace' });
            organizationId = defaultOrg._id.toString();
          }
        }
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      const user = await User.create({
        fullName: input.fullName,
        email,
        passwordHash,
        role,
        avatarUrl: input.avatarUrl?.trim() ? input.avatarUrl.trim() : null,
        organizationId,
      });

      logger.info(`User registered: ${user.email}`);

      return this.buildAuthResponse(user.toObject() as PersistedUser);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logAuthError('Error registering user', error);
      throw new ApiError('Failed to register user', 500);
    }
  }

  async login(input: LoginInput): Promise<IAuthResponse> {
    try {
      const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');

      if (!user) {
        throw new ApiError('Invalid email or password', 401);
      }

      const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

      if (!passwordMatches) {
        throw new ApiError('Invalid email or password', 401);
      }

      logger.info(`User logged in: ${user.email}`);

      return this.buildAuthResponse(user.toObject() as PersistedUser);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logAuthError('Error logging in user', error);
      throw new ApiError('Failed to log in user', 500);
    }
  }

  async refreshToken(input: RefreshTokenInput): Promise<IAuthResponse> {
    try {
      const decoded = jwt.verify(input.refreshToken, this.refreshTokenSecret);

      if (typeof decoded !== 'object' || decoded === null || typeof decoded.id !== 'string' || typeof decoded.email !== 'string' || typeof decoded.role !== 'string' || typeof decoded.organizationId !== 'string') {
        throw new ApiError('Invalid refresh token', 401);
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      return this.buildAuthResponse(user.toObject() as PersistedUser);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      logAuthError('Error refreshing auth token', error);
      throw new ApiError('Invalid refresh token', 401);
    }
  }

  async getCurrentUser(userId: string): Promise<IUserPublic> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return toUserPublic(user.toObject() as PersistedUser);
  }

  async getUsers(): Promise<IUserPublic[]> {
    const users = await User.find();
    return users.map((u) => toUserPublic(u.toObject() as PersistedUser));
  }
}

export const authService = new AuthService();