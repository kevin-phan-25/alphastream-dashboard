const CORE_URL =
  process.env.NEXT_PUBLIC_CORE_URL ||
  "https://alphastream-core-1017433009054.us-east1.run.app";


const ADMIN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_KEY || "";



async function request<T>(

  url:string,

  options?:RequestInit

):Promise<T>{


  const response =
    await fetch(

      url,

      {

        ...options,

        headers:{

          "Content-Type":
            "application/json",

          "x-admin-key":
            ADMIN_KEY,

          ...(options?.headers || {}),

        },

      }

    );



  if(!response.ok){

    throw new Error(
      `API Error ${response.status}`
    );

  }



  return response.json();

}




export function getCoreStatus(){


  return request<any>(

    `${CORE_URL}/status`

  );


}



export async function getCoreLogs(){


  const data =
    await request<any>(

      `${CORE_URL}/admin/logs?limit=200`

    );



  return Array.isArray(data.logs)

    ? data.logs

    : [];

}




export function triggerScan(){


  return request(

    `${CORE_URL}/admin/scan`,

    {

      method:"POST",

    }

  );

}




export function triggerHardFlat(){


  return request(

    `${CORE_URL}/admin/hard-flat`,

    {

      method:"POST",

    }

  );

}




export function clearBlacklist(){


  return request(

    `${CORE_URL}/admin/clear-blacklist`,

    {

      method:"POST",

    }

  );

}
