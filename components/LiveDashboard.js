const loadData = async () => {
  try {
    const res = await fetch("/api/refresh");
    const json = await res.json();
    const data = json.data || {};
    setScan(data.signals || []);
    setStats(data.stats || {});
    setBacktest(data.backtest || []);
  } catch (e) {
    console.error("Load error:", e);
  }
};

useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 5000); // auto-refresh every 5s
  return () => clearInterval(interval);
}, []);
