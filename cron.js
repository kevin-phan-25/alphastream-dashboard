import cron from 'node-cron';
import { scan } from './services/scanner.js';
import { closeAll } from './jobs/closePositions.js';
import { log } from './utils/logger.js';

cron.schedule('* * * * *', () => {
  scan().catch(console.error);
});

cron.schedule('55 15 * * 1-5', () => {
  closeAll().catch(console.error);
}, { timezone: 'America/New_York' });

log('CRON_STARTED', '', 'Node.js AlphaStream v20.9.6');
