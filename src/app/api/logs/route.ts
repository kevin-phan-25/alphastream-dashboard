/**
 * Date: 2026-08-06
 * File: src/app/api/logs/route.ts
 *
 * Changes:
 * - Proxy logs request to Cloud Run
 * - Adds x-admin-key server-side
 */


import { coreFetch } from "@/lib/core";


export async function GET() {


  const response =
    await coreFetch(
      "/admin/logs"
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
