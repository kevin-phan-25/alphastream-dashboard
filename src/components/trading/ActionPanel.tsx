"use client";


import {

  triggerScan,

  triggerHardFlat,

  clearBlacklist,

} from "@/services/alphastream";



export default function ActionPanel(){



return (

<div

className="
flex
flex-wrap
gap-4
"

>


<button

onClick={()=>triggerScan()}

className="
bg-emerald-600
hover:bg-emerald-700
px-6
py-3
rounded-xl
font-medium
"

>

MANUAL SCAN

</button>




<button

onClick={()=>{

if(
confirm(
"Execute emergency flatten?"
)
)

triggerHardFlat();

}}

className="
bg-red-600
hover:bg-red-700
px-6
py-3
rounded-xl
font-medium
"

>

PANIC FLAT

</button>




<button

onClick={()=>clearBlacklist()}

className="
bg-zinc-700
hover:bg-zinc-600
px-6
py-3
rounded-xl
font-medium
"

>

CLEAR BLACKLIST

</button>



</div>

);


}
