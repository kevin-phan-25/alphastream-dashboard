"use client";


import {
useEffect,
useState
} from "react";


import {
getStatus,
getLogs
} from "@/services/alphastream";


import {
CoreStatus
} from "@/types/alphastream";



export function useAlphaStream(){


const [status,setStatus]=
useState<CoreStatus|null>(null);


const [logs,setLogs]=
useState<string[]>([]);


const [error,setError]=
useState<string|null>(null);



async function refresh(){

try{


const [
statusData,
logsData
]=await Promise.all([

getStatus(),

getLogs()

]);



setStatus(statusData);

setLogs(
logsData.logs || []
);


setError(null);


}catch(e:any){

setError(e.message);

}

}



useEffect(()=>{


refresh();


const timer=setInterval(
refresh,
10000
);


return()=>clearInterval(timer);


},[]);



return{

status,

logs,

error,

refresh

};


}
