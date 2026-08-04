"use client";


import {
 useEffect,
 useState,
} from "react";


import {

 getHealth,

 getStatus,

 getMetrics,

 getPositions,

 getTrades,

 getLogs,

} from "@/services/alphastream";




export function useAlphaStream(){


 const [data,setData]=useState<any>({

  health:null,

  status:null,

  metrics:null,

  positions:null,

  trades:null,

  logs:null,

 });



 const [error,setError]=useState<string|null>(
  null
 );




 async function refresh(){


  try{


   const [

    health,

    status,

    metrics,

    positions,

    trades,

    logs,


   ] = await Promise.all([


    getHealth(),

    getStatus(),

    getMetrics(),

    getPositions(),

    getTrades(),

    getLogs(),


   ]);




   setData({

    health,

    status,

    metrics,

    positions,

    trades,

    logs,

   });



   setError(null);



  }

  catch(err:any){


   console.error(

    "AlphaStream refresh failed:",

    err

   );


   setError(

    err?.message ??

    "Unable to connect"

   );


  }


 }





 useEffect(()=>{


  refresh();



  const interval =
    setInterval(

      refresh,

      30000

    );



  return()=>clearInterval(interval);



 },[]);





 return {

  ...data,

  error,

  refresh,

 };


}
