import { scan } from '../services/scanner.js';
import { log } from '../utils/logger.js';

export const config = { schedule: '* * * * *' };

export default async function handler(req, res) {
  await log('CRON', '', 'Scan started');
  await scan();
  res.status(200).json({ ok: true });
}
