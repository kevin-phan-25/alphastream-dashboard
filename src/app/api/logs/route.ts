/**
 * ---
 * File:
 * src/app/api/logs/route.ts
 *
 * Description:
 * Secure proxy to AlphaStream Core admin logs.
 *
 * Changes:
 * - Keeps ADMIN_KEY server-side
 * - Proxies Cloud Run admin request
 * - Prevents exposing secrets to browser
 *
 * ---
 */


import { NextResponse } from "next/server";


export async function GET() {

  const CORE_URL =
    process.env.CORE_URL;


  const ADMIN_KEY =
    process.env.ADMIN_KEY;



  if (!CORE_URL || !ADMIN_KEY) {

    return NextResponse.json(
      {
        error:
          "Missing server configuration",
      },
      {
        status:500,
      }
    );

  }



  const response =
    await fetch(
      `${CORE_URL}/admin/logs`,
      {
        method:"GET",

        headers:{
          "x-admin-key": ADMIN_KEY,
        },

        cache:"no-store",
      }
    );



  const data =
    await response.json();



  return NextResponse.json(
    data,
    {
      status:
        response.status,
    }
  );

}
