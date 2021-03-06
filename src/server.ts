import 'module-alias/register';

import fastify from 'fastify';
import fastifyCors from 'fastify-cors';

import { PortConfig } from './modules/config';

import 'tasks';

import { Log } from '@dustinrouillard/fastify-utilities/modules/logger';
import { Logger, Missing } from '@dustinrouillard/fastify-utilities/modules/request';

import { AuthenticatedRoutes, UnauthenticatedRoutes, TaskRoutes } from './routes';

const server = fastify();

// Register request logger
server.register(Logger);

server.register(fastifyCors, {
  origin: (_origin, cb) => {
    cb(null, true);
  }
});

// Routes
server.register(AuthenticatedRoutes);
server.register(UnauthenticatedRoutes);
server.register(TaskRoutes);
server.register(Missing);

server.listen(PortConfig, '0.0.0.0', () => Log(`Server ready on ${PortConfig}`));
