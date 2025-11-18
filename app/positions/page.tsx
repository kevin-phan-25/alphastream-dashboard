'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Positions() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    // Fetch from GAS or bot /positions (add to bot if needed)
    axios.get(process.env.GAS_SHEET_URL!).then(res => {
      // Parse sheet rows for positions (adapt based on your GAS export)
      setPositions(res.data.slice(1).filter(row => row[1] === 'POS_SYNC'));  // Example filter
    });
  }, []);

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Positions</h2>
      {positions.length === 0 ? <p>No positions.</p> : (
        <ul className="space-y-2">
          {positions.map((pos, i) => <li key={i} className="p-4 bg-white rounded shadow">{pos[2]}</li>)}  // Symbol from sheet
        </ul>
      )}
    </main>
  );
}
