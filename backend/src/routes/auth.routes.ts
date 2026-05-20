import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import logger from '../config/logger';
import { ValidationError } from '../errors/ValidationError';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, refreshTokenSchema, registerSchema, inviteSchema } from '../validators/auth.validation';

export const authRouter = Router();

authRouter.post('/register', (req, _res, next) => {
	const parsed = registerSchema.safeParse(req.body);

	if (!parsed.success) {
		logger.error('Validation Error: /api/auth/register failed');
		console.error({
			route: '/api/auth/register',
			method: req.method,
			body: req.body,
			issues: parsed.error.issues,
			flattened: parsed.error.flatten(),
		});

		next(
			new ValidationError(
				'Validation failed',
				parsed.error.errors.map((issue) => ({
					field: issue.path.join('.'),
					message: issue.message,
				})),
			),
		);
		return;
	}

	req.body = parsed.data;
	next();
}, authController.register);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
authRouter.get('/me', authMiddleware, authController.getMe);
authRouter.get('/users', authMiddleware, authController.getUsers);
authRouter.post('/invite', authMiddleware, validateBody(inviteSchema), authController.inviteUser);