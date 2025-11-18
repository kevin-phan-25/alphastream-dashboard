'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Health() {
  const [status, setStatus] = useState({});

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`).then(res => setStatus(res.data));
  }, []);

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-4">Health</h2>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(status, null, 2)}</pre>
    </main>
  );
}
