import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    })
  );

  app.use('/api', routes);

  app.get('/', (req, res) => {
    res.json({
      name: 'Gradient Generation API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/health',
        generate: 'POST /api/generate',
        gradients: {
          list: 'GET /api/gradients',
          public: 'GET /api/gradients/public',
          get: 'GET /api/gradients/:id',
          create: 'POST /api/gradients',
          update: 'PUT /api/gradients/:id',
          delete: 'DELETE /api/gradients/:id',
        },
        accessibility: 'POST /api/validate/accessibility',
        export: {
          css: 'POST /api/export/css',
          tailwind: 'POST /api/export/tailwind',
          image: 'POST /api/export/image',
        },
        users: {
          profile: 'GET /api/users/profile',
          updateProfile: 'PUT /api/users/profile',
          stats: 'GET /api/users/stats',
        },
        analytics: {
          track: 'POST /api/analytics/track',
          trending: 'GET /api/analytics/trending',
          popular: 'GET /api/analytics/popular',
        },
      },
    });
  });

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
