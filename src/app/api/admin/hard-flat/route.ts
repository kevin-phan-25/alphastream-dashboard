/**
 * Date: 2026-08-06
 * File: src/app/api/admin/scan/route.ts
 */


import { coreFetch } from "@/lib/core";


export async function POST() {


  const response =
    await coreFetch(
      "/admin/scan",
      {
        method:"POST",
      }
    );


  const data =
    await response.json();


  return Response.json(
    data,
    {
      status: response.status,
    }
  );

}
