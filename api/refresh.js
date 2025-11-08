import { google } from "googleapis";

// Replace these with your GAS credentials / service account info
const SPREADSHEET_ID = '132UO_KDxDIP43XQdEjYX3edZnRd2gUMec2AQDizEfu8';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getSheetData(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName
  });
  const values = res.data.values || [];
  const headers = values[0] || [];
  return values.slice(1).map(row =>
    headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] }), {})
  );
}

export default async function handler(req, res) {
  try {
    const [scan, backtest, log] = await Promise.all([
      getSheetData('scanner'),
      getSheetData('backtest'),
      getSheetData('trades')
    ]);

    const stats = {
      trades: log.length,
      pnl: log.reduce((sum, r) => sum + parseFloat(r.PnL || 0), 0)
    };

    res.status(200).json({
      data: {
        signals: scan.map(r => ({
          s: r.Sym,
          qty: parseFloat(r.Qty),
          stop: parseFloat(r.Stop),
          tgt: parseFloat(r.Tgt),
          pattern: r.Pattern,
          score: parseFloat(r.Score)
        })),
        stats,
        backtest: backtest.map(r => ({
          symbol: r.Sym,
          entry: parseFloat(r.Entry),
          exit: parseFloat(r.Exit),
          pnl: parseFloat(r.PnL)
        }))
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read data' });
  }
}
