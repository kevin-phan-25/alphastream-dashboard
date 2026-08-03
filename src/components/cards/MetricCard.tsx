interface MetricCardProps {

  title:string;

  value:string | number;

}



export default function MetricCard({

  title,

  value,

}:MetricCardProps){


return (

<div

className="
bg-zinc-900
border
border-zinc-800
rounded-2xl
p-5
"

>


<p

className="
text-xs
text-zinc-500
tracking-wide
"

>

{title}

</p>



<p

className="
text-3xl
font-mono
mt-3
text-white
"

>

{value}

</p>



</div>

);


}
