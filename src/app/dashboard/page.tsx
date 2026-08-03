/**
 * ---------------------------------------------------------
 * Date: 2026-08-03
 * File: src/app/dashboard/page.tsx
 *
 * Changes:
 * - Fixed hook import casing
 * - Removed broken component dependencies
 * - Added Phase 1 Core dashboard
 * - Displays live AlphaStream Core status
 * ---------------------------------------------------------
 */

"use client";


import {
  useAlphaStream,
} from "@/hooks/useAlphaStream";


export default function DashboardPage() {


  const {
    status,
    logs,
    loading,
    refresh,

  } = useAlphaStream();



  return (

    <main className="min-h-screen bg-black text-white p-8">


      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-3xl font-bold">
            AlphaStream Dashboard
          </h1>


          <p className="text-gray-400">
            Core Service Monitoring
          </p>

        </div>


        <button
          onClick={refresh}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
        >
          Refresh
        </button>

      </div>



      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">


        <Metric
          title="Equity"
          value={
            status?.equity ?? "0"
          }
        />


        <Metric
          title="Positions"
          value={
            status?.positions ?? "0"
          }
        />


        <Metric
          title="Win Rate"
          value={
            `${status?.winRate ?? 0}%`
          }
        />


        <Metric
          title="Drawdown"
          value={
            `${status?.drawdownPct ?? 0}%`
          }
        />


      </section>



      <section className="mt-8">


        <h2 className="text-xl mb-4">
          System Logs
        </h2>


        <div className="bg-zinc-900 rounded-lg p-4">

          {loading && (
            <p>
              Loading...
            </p>
          )}


          {!loading &&
            logs.map(
              (log,index)=>(
                <p
                  key={index}
                  className="text-sm text-gray-300"
                >
                  {log}
                </p>
              )
            )
          }


        </div>


      </section>


    </main>

  );

}



function Metric(
{
 title,
 value,
}:{
 title:string;
 value:string|number;
}
){

 return (

  <div className="bg-zinc-900 rounded-xl p-5">

    <p className="text-gray-400 text-sm">
      {title}
    </p>

    <p className="text-2xl font-bold mt-2">
      {value}
    </p>

  </div>

 );

}
