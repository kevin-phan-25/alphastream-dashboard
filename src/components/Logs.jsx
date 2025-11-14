import React from 'react';

const Logs = ({ logs }) => (
  <div>
    <h2>Activity Logs</h2>
    <ul>
      {logs.slice(0, 50).map(log => (
        <li key={log.id}>
          [{new Date(log.created_at).toLocaleString()}] {log.event} | {log.symbol} | {log.note}
        </li>
      ))}
    </ul>
  </div>
);

export default Logs;
