// api/close.js
import { closeAll } from '../services/alpaca.js';
export default async (req, res) => { await closeAll(); res.json({ ok: true }); };
