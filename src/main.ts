import { bootstrap } from './infrastructure/bootstrap';

bootstrap().catch((err) => {
  console.error('Failed to bootstrap:', err);
});
