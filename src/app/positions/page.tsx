'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Positions() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await axios.get(`${process.env.GAS_SHEET_URL}`);
        const data = res.data.slice(1);  // Skip header
        const pos = data.filter((row: any) => row[1] === 'POS_SYNC').map((row: any) => row[2]);  // Symbols from logs
        setPositions(pos);
      } catch (e) {
        console.error('GAS fetch failed', e);
      }
    };
    fetchPositions();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Open Positions</h2>
      {positions.length === 0 ? (
        <p className="text-gray-500">No positions – trigger a scan!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {positions.map((sym, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-bold">{sym}</h3>
              <p className="text-sm text-gray-500">Live from GAS logs</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
