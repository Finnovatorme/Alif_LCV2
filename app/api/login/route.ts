import { NextResponse } from "next/server";
import { decryptDetails } from "@/utils/dataSecurity/decrypt";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, rememberMe, payload, isEncrypted } = body;
  const protocolCheck = req.headers.get("x-forwarded-proto");

  let loginUrl = `${process.env.BS_API_KEY}/api/Authentication`;
  let loginBody = JSON.stringify({ userName: username, password });

  if (payload || isEncrypted) {
    loginUrl = `${process.env.BS_API_KEY}/api/Authentication/LoginUser`;
    loginBody = JSON.stringify({ payload });
  }

  if (!process.env.BS_API_KEY) {
    return NextResponse.json({ error: "BS_API_KEY not defined" }, { status: 500 });
  }

  try {
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: loginBody,
    });

    const responseText = await loginResponse.text();
    let res;

    try {
      res = JSON.parse(responseText);
    } catch (e) {
      // If it's not JSON, it's likely a raw encrypted string.
      // We decrypt it here to get the token for the cookie.
      res = await decryptDetails(responseText);
    }

    // Now res is either the JSON or the decrypted object
    if (res && res.payload && typeof res.payload === "string") {
      res = await decryptDetails(res.payload);
    }

    // If the backend returned an error status code
    if (res.Code && res.Code !== 200) {
      return NextResponse.json(
        { statusCode: res.Code, error: res.Data || res.ResponseMessage || "Authentication failed" },
        { status: res.Code }
      );
    }

    const userData = Array.isArray(res.Data) ? res.Data[0] : (res.Data || res);
    
    // Search for token in all possible locations
    const token = res.Token || res.token || (res.Data && (res.Data.Token || res.Data.token)) || (userData && (userData.Token || userData.token));

    if (!token) {
       return NextResponse.json({ success: true, data: res, tokenFound: false });
    }

    const data = {
      token: token,
      userId: userData.Userid || userData.UserId || userData.USERID || userData.userid,
      Username1: userData.Username1 || userData.USERNAME1,
      Email: userData.Email || userData.EMAIL,
      ...userData,
    };

    const response = NextResponse.json({ success: true, data, tokenFound: true });

    if (token) {
      // Set secure: false if on localhost to ensure it's accepted
      const isHttps = protocolCheck === "https";

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: isHttps,
        path: "/",
        sameSite: "lax",
        maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
