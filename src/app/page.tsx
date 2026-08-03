"use client";


import {
Activity,
Rocket,
ShieldAlert,
RefreshCw
} from "lucide-react";


import {
useAlphaStream
} from "@/hooks/useAlphaStream";


import {
scan,
hardFlat,
clearBlacklist
} from "@/services/alphastream";



export default function Home(){


const {
status,
logs,
error,
refresh

}=useAlphaStream();




return (

<div className="
min-h-screen
bg-black
text-white
p-8
">


<header className="
flex
justify-between
items-center
mb-10
">


<div>

<h1 className="
text-5xl
font-bold
flex
gap-3
items-center
">

<Rocket
className="text-emerald-400"
/>

ALPHASTREAM

</h1>


<p className="
text-zinc-500
mt-2
">

2026-Go-Core Autonomous Trading System

</p>


</div>



<button
onClick={refresh}
className="
bg-zinc-800
px-5
py-3
rounded-xl
flex
gap-2
"
>

<RefreshCw size={18}/>

Refresh

</button>


</header>





{error && (

<div className="
bg-red-900
p-4
rounded-xl
mb-5
">

{error}

</div>

)}




<div className="
grid
grid-cols-1
md:grid-cols-5
gap-5
mb-8
">


<Card
title="Equity"
value={
status
?
`$${status.equity.toLocaleString()}`
:
"--"
}
/>



<Card
title="Drawdown"
value={
status
?
`${status.drawdownPct.toFixed(2)}%`
:
"--"
}
/>



<Card
title="Win Rate"
value={
status
?
`${status.winRate.toFixed(1)}%`
:
"--"
}
/>



<Card
title="Positions"
value={
status
?
`${status.positionsCount}/7`
:
"--"
}
/>



<Card
title="Trades"
value={
status
?
status.totalTrades
:
"--"
}
/>


</div>






<div className="
flex
gap-4
mb-8
">


<button
onClick={scan}
className="
bg-emerald-600
px-6
py-3
rounded-xl
"
>

SCAN

</button>



<button
onClick={hardFlat}
className="
bg-red-600
px-6
py-3
rounded-xl
flex
gap-2
"
>

<ShieldAlert/>

PANIC FLAT

</button>




<button
onClick={clearBlacklist}
className="
bg-zinc-700
px-6
py-3
rounded-xl
">

CLEAR BLACKLIST

</button>


</div>






<section className="
bg-zinc-900
rounded-2xl
p-6
">


<h2 className="
flex
gap-2
mb-4
font-semibold
">

<Activity/>

ACTIVITY LOGS

</h2>



<div className="
font-mono
text-sm
space-y-2
h-[400px]
overflow-auto
">


{
logs.map(
(log,i)=>(

<div
key={i}
className="
border-b
border-zinc-800
pb-2
"
>

{log}

</div>

)

)

}



</div>


</section>



</div>

);

}




function Card(
{
title,
value
}:{
title:string;
value:any;
}

){

return (

<div className="
bg-zinc-900
border
border-zinc-800
rounded-2xl
p-5
">


<p className="
text-zinc-500
text-sm
">

{title}

</p>


<p className="
text-3xl
font-mono
mt-2
">

{value}

</p>


</div>

)

}
