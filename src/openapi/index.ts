import { apiReference } from '@scalar/express-api-reference';
import packageJson from 'package.json';
import { createDocument } from 'zod-openapi';
import { authDoc } from './auth.doc';
import { defaultDoc } from './default.doc';
import { notificationsDoc } from './notifications.doc';
import { ordersDoc } from './orders.doc';
import { productsDoc } from './products.doc';
import { reviewsDoc } from './reviews.doc';
import { usersDoc } from './users.doc';

export const openApiSpecs = createDocument({
  info: {
    title: 'Express Server',
    version: packageJson.version,
    description: 'Express server with scalar for openapi documentation'
  },
  openapi: '3.1.0',
  paths: {
    ...defaultDoc,
    ...authDoc,
    ...usersDoc,
    ...productsDoc,
    ...reviewsDoc,
    ...ordersDoc,
    ...notificationsDoc
  }
});

export const serveApiReference = apiReference({
  spec: { content: openApiSpecs },
  theme: 'kepler',
  darkMode: true,
  layout: 'modern',
  defaultHttpClient: {
    targetKey: 'javascript',
    clientKey: 'fetch'
  },
  metaData: {
    title: 'Express Server Api Reference'
  }
});
