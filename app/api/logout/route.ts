import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the auth_token cookie
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // Set expiration to 1970
  });

  return response;
}
