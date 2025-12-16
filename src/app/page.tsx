'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { RefreshCw, Activity, Sun, Moon, AlertCircle, DollarSign, Wallet, Zap, Globe, Bot, Loader2 } from 'lucide-react';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Line = dynamic(()=>import('react-chartjs-2').then(mod=>mod.Line), { ssr:false });

type Rocket = { symbol:string; gap:string; price:string; rvol:string; volume:string; mlPriority:boolean; mlAction:number; };
type Position = { symbol:string; qty:string; avg_entry_price:string; current:string; unrealized_plpc:string; };

export default function Home() {
  const [rockets,setRockets]=useState<Rocket[]>([]);
  const [positions,setPositions]=useState<Position[]>([]);
  const [equity,setEquity]=useState(0);
  const [loading,setLoading]=useState(false);

  const fetchData=async()=>{
    setLoading(true);
    try{
      const { data } = await axios.get('/api/dashboard');
      setEquity(data.equity);
      setRockets(data.rockets);
      setPositions(data.positions);
    }catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ fetchData(); const i=setInterval(fetchData,15000); return ()=>clearInterval(i); },[]);

  return (
    <div className="p-4">
