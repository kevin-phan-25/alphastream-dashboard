const CORE_URL =
  process.env.NEXT_PUBLIC_CORE_URL ||
  "https://alphastream-core-1017433009054.us-east1.run.app";


const ADMIN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_KEY || "";



async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {


  const response =
    await fetch(
      `${CORE_URL}${endpoint}`,
      {

        ...options,


        headers: {

          "Content-Type":
            "application/json",


          "x-admin-key":
            ADMIN_KEY,


          ...(options?.headers || {}),

        },

      }
    );



  if (!response.ok) {

    throw new Error(
      `AlphaStream Core error: ${response.status}`
    );

  }



  return response.json();

}




// =========================
// CORE STATUS
// =========================

export function getStatus() {

  return request<any>(
    "/status"
  );

}



// =========================
// CORE LOGS
// =========================

export async function getLogs() {

  const response =
    await request<{
      logs:string[]
    }>(
      "/admin/logs?limit=200"
    );


  return response.logs || [];

}




// =========================
// TRADING ACTIONS
// =========================

export function scan() {

  return request(
    "/admin/scan",
    {
      method:"POST",
    }
  );

}




export function hardFlat() {

  return request(
    "/admin/hard-flat",
    {
      method:"POST",
    }
  );

}




export function clearBlacklist() {

  return request(
    "/admin/clear-blacklist",
    {
      method:"POST",
    }
  );

}
