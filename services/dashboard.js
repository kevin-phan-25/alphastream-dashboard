import axios from 'axios';
import { log } from '../utils/logger.js';

export const dashboard = async (type, data) => {
  try {
    await axios.post(process.env.DASHBOARD_WEBHOOK, {
      type,
      data: { ...data, version: 'v20.9.6' },
      t: new Date().toISOString()
    }, {
      headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET }
    });
    log('DASH_OK', type, 'Sent');
  } catch (err) {
    log('DASH_FAIL', type, err.message);
  }
};
