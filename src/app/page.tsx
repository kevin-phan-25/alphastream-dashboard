'use client';
          className="px-6 py-1.5 bg-cyan-600 rounded flex items-center gap-1.5 text-black font-bold text-2xs hover:bg-cyan-500 disabled:opacity-50 transition"
        >
          {scanLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {scanLoading ? "SCANNING" : "FORCE SCAN"}
        </button>
      </div>

      {/* EQUITY */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded p-2 text-center mb-3 border border-purple-700">
        <div className="text-2xs text-gray-400">LIVE ALPACA EQUITY</div>
        <div className="text-xl font-bold text-white mt-0.5">{equity}</div>
      </div>

      {/* ML CONFIDENCE GAUGE */}
      <div className="bg-gray-900 rounded p-3 mb-3 border border-purple-600">
        <div className="text-purple-400 font-bold text-center text-2xs mb-2">RAINBOW DQN CONFIDENCE</div>

        <div className="relative w-28 h-28 mx-auto">
          <svg viewBox="0 0 36 36" className="transform -rotate-90 w-full h-full">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5" />
            <defs>
              <linearGradient id="grad">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="2.5"
              strokeDasharray={`${mlConfidence} 100`}
              className="transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-bold text-white">
              {mlConfidence}%
            </div>
            <div className="text-2xs text-gray-400 mt-0.5">
              {mlConfidence < 40 ? "LEARNING" : mlConfidence < 70 ? "CAUTIOUS" : "CONFIDENT"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-2xs">
          <div><span className="text-gray-500">Epsilon:</span> <span className="font-bold text-cyan-400">{ml?.epsilon ? parseFloat(ml.epsilon).toFixed(3) : "—"}</span></div>
          <div><span className="text-gray-500">Step:</span> <span className="font-bold text-yellow-400">{ml?.step || 0}</span></div>
          <div><span className="text-gray-500">Buffer:</span> <span className="font-bold text-green-400">{ml?.bufferSize || 0}</span></div>
          <div><span className="text-gray-500">Last Train:</span> <span className="font-bold text-purple-400">{ml?.lastTrained ? new Date(ml.lastTrained).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</span></div>
        </div>
      </div>

      {/* POSITIONS */}
      <Panel title="LIVE POSITIONS" color="text-green-400">
        {positions.length >
