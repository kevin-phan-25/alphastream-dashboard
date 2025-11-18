<button
  onClick={toggle}
  className="relative p-3 rounded-full bg-gray-200/50 dark:bg-gray-800/70 backdrop-blur hover:scale-110 transition-all duration-200 shadow-lg"
>
  <div className="w-6 h-6">
    {darkMode ? (
      <Sun className="w-full h-full text-yellow-400 drop-shadow-glow" />
    ) : (
      <Moon className="w-full h-full text-gray-800" />
    )}
  </div>
</button>
