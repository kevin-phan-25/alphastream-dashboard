'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Health() {
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`).then((res) => setData(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bot Health Raw</h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl overflow-auto text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
