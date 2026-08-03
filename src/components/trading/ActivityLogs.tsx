interface Props {

logs:string[];

}



export default function ActivityLogs({

logs,

}:Props){


return (

<div

className="
bg-zinc-900
border
border-zinc-800
rounded-2xl
p-6
"

>


<div

className="
bg-black
rounded-xl
p-4
h-[420px]
overflow-auto
font-mono
text-sm
"

>


{

logs.length === 0 ? (


<p className="text-zinc-500">

No activity logs

</p>


)

:

logs.map(

(log,index)=>(


<div

key={index}

className="
py-2
border-b
border-zinc-900
"

>

{log}

</div>


)

)

}



</div>


</div>

);


}
