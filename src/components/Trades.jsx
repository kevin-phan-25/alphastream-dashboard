import React from 'react';

const Trades = ({ trades }) => (
  <div>
    <h2>Recent Trades</h2>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Entry</th>
          <th>Stop</th>
          <th>Target</th>
          <th>P&L</th>
        </tr>
      </thead>
      <tbody>
        {trades.map(trade => (
          <tr key={trade.id}>
            <td>{trade.symbol}</td>
            <td>{trade.side}</td>
            <td>{trade.qty}</td>
            <td>${trade.entry_price}</td>
            <td>${trade.stop_price}</td>
            <td>${trade.target_price}</td>
            <td>${trade.pnl}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Trades;
