import { syncCurriculum } from '../lib/curriculum-sync';

syncCurriculum(process.argv[2] || 'manual').then((n) => {
  console.log(`curriculum synced: ${n} labs`);
  process.exit(0);
});
