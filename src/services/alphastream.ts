import { CoreLogs, CoreStatus } from "@/types/alphastream";


const CORE_URL =
process.env.NEXT_PUBLIC_CORE_URL;


const ADMIN_KEY =
process.env.NEXT_PUBLIC_ADMIN_KEY;



const headers = {

"x-admin-key":ADMIN_KEY ?? "",

"Content-Type":"application/json"

};



async function request<T>(
endpoint:string,
options?:RequestInit
):Promise<T>{


const res = await fetch(
`${CORE_URL}${endpoint}`,
{
...options,
headers:{
...headers,
...(options?.headers || {})
},

cache:"no-store"

});


if(!res.ok){

throw new Error(
`${endpoint} failed ${res.status}`
);

}


return res.json();

}



export function getStatus(){

return request<CoreStatus>(
"/status"
);

}



export function getLogs(){

return request<CoreLogs>(
"/admin/logs"
);

}



export function scan(){

return request(
"/admin/scan",
{
method:"POST"
}
);

}



export function hardFlat(){

return request(
"/admin/hard-flat",
{
method:"POST"
}
);

}



export function clearBlacklist(){

return request(
"/admin/clear-blacklist",
{
method:"POST"
}
);

}
