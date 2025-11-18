'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Health() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_BOT_URL}/`).then(res => setData(res.data));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Raw Bot Health</h2>
      <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
