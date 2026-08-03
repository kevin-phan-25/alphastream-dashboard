"use client";


import {
  Activity,
  CheckCircle,
  Rocket,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";


import {
  useAlphastream,
} from "@/hooks/useAlphaStream";


import MetricCard from "@/components/cards/MetricCard";


import ActionPanel from "@/components/trading/ActionPanel";


import ActivityLogs from "@/components/trading/ActivityLogs";



export default function DashboardPage() {


  const {

    status,

    logs,

    connected,

    error,

    refresh,

  } = useAlphastream();




  return (

    <main
      className="
      min-h-screen
      bg-black
      text-white
      px-6
      py-8
      md:px-10
      "
    >


      {/* Header */}

      <header
        className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-6
        mb-10
        "
      >


        <div>


          <h1
            className="
            text-4xl
            md:text-5xl
            font-bold
            flex
            items-center
            gap-3
            "
          >

            <Rocket
              className="text-emerald-400"
              size={42}
            />

            ALPHASTREAM

          </h1>


          <p
            className="
            text-zinc-500
            mt-2
            "
          >

            Autonomous Trading Operations Dashboard

          </p>


        </div>




        <button

          onClick={refresh}

          className="
          flex
          items-center
          gap-2
          bg-zinc-800
          hover:bg-zinc-700
          px-5
          py-3
          rounded-xl
          "

        >

          <RefreshCw size={18}/>

          Refresh

        </button>



      </header>





      {/* Connection */}

      <div className="mb-6">


        {
          connected ? (

            <div
              className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              bg-emerald-900/40
              text-emerald-400
              "
            >

              <CheckCircle size={18}/>

              CORE ONLINE

            </div>


          ) : (


            <div
              className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              bg-red-900/40
              text-red-400
              "
            >

              <XCircle size={18}/>

              CORE OFFLINE

            </div>


          )
        }


      </div>





      {
        error && (

          <div
            className="
            mb-6
            rounded-xl
            border
            border-red-500/30
            bg-red-950
            px-5
            py-4
            text-red-300
            "
          >

            {error}

          </div>

        )
      }





      {/* Metrics */}

      <section
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-5
        gap-5
        mb-8
        "
      >


        <MetricCard

          title="EQUITY"

          value={
            status
            ?
            `$${status.equity.toLocaleString(
              undefined,
              {
                maximumFractionDigits:2
              }
            )}`
            :
            "--"
          }

        />



        <MetricCard

          title="DRAWDOWN"

          value={
            status
            ?
            `${status.drawdownPct.toFixed(2)}%`
            :
            "--"
          }

        />



        <MetricCard

          title="WIN RATE"

          value={
            status
            ?
            `${status.winRate.toFixed(1)}%`
            :
            "--"
          }

        />



        <MetricCard

          title="POSITIONS"

          value={
            status
            ?
            `${status.positionsCount}/7`
            :
            "--"
          }

        />



        <MetricCard

          title="TOTAL TRADES"

          value={
            status
            ?
            status.totalTrades
            :
            "--"
          }

        />


      </section>






      {/* System Flags */}

      {
        status?.hardFlat && (

          <div
            className="
            mb-6
            flex
            items-center
            gap-2
            rounded-xl
            bg-red-950
            border
            border-red-500/30
            px-5
            py-3
            text-red-300
            "
          >

            <ShieldAlert size={18}/>

            HARD FLAT ACTIVE

          </div>

        )
      }




      {
        status?.degraded && (

          <div
            className="
            mb-6
            rounded-xl
            bg-yellow-950
            border
            border-yellow-500/30
            px-5
            py-3
            text-yellow-300
            "
          >

            SYSTEM DEGRADED

          </div>

        )
      }





      {/* Actions */}

      <ActionPanel/>





      {/* Logs */}

      <section
        className="
        mt-8
        "
      >

        <div
          className="
          flex
          items-center
          gap-2
          mb-4
          text-zinc-400
          "
        >

          <Activity size={18}/>

          LIVE CORE ACTIVITY

        </div>


        <ActivityLogs
          logs={logs}
        />


      </section>





      <footer
        className="
        text-center
        text-xs
        text-zinc-600
        mt-10
        "
      >

        AlphaStream Core • 2026 Go Trading Engine

      </footer>



    </main>

  );

}
