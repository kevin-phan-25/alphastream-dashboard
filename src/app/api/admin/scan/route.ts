/**
 * ---
 * File:
 * src/app/api/admin/scan/route.ts
 *
 * Description:
 * Secure AlphaStream Core scan trigger proxy.
 *
 * Changes:
 * - Keeps ADMIN_KEY server-side
 * - Proxies admin scan request to Cloud Run
 * - Prevents exposing credentials in browser
 *
 * ---
 */


import { NextResponse } from "next/server";



export async function POST() {

  const CORE_URL =
    process.env.CORE_URL;


  const ADMIN_KEY =
    process.env.ADMIN_KEY;



  if (!CORE_URL || !ADMIN_KEY) {

    return NextResponse.json(
      {
        error:
          "Missing AlphaStream server configuration",
      },
      {
        status:500,
      }
    );

  }



  try {

    const response =
      await fetch(
        `${CORE_URL}/admin/scan`,
        {
          method:"POST",

          headers:{
            "x-admin-key":ADMIN_KEY,
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


  } catch(error){

    return NextResponse.json(
      {
        error:
          "Failed to connect to AlphaStream Core",
      },
      {
        status:502,
      }
    );

  }

}
