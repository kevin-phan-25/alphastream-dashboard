// api/scan.js
import { scan } from '../services/scanner.js';
export default async (req, res) => { await scan(); res.json({ ok: true }); };
