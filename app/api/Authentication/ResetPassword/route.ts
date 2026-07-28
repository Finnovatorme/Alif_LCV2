import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Same fields as FinsolNewTheme's ResetPassword
    const payload = {
      userId: body.userId,
      email: body.email,
      token: body.token,
      newPassword: body.newPassword,
    };

    console.log("[ResetPassword] Sending payload to backend:", {
      userId: payload.userId,
      email: payload.email,
      token: payload.token ? `${payload.token.slice(0, 10)}...` : "N/A",
      newPassword: "***",
    });

    const bsResponse = await fetch(
      `${process.env.BS_API_KEY}/api/Authentication/ResetPassword`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const text = await bsResponse.text();
    console.log("[ResetPassword] Raw backend response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!bsResponse.ok) {
      const errMsg =
        data?.responsemessage ||
        data?.ResponseMessage ||
        data?.message ||
        data?.error ||
        "Password reset failed";
      console.error("[ResetPassword] Backend error:", bsResponse.status, errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: bsResponse.status }
      );
    }

    // FinsolNewTheme uses responseCode === 200
    const code =
      data?.responseCode !== undefined
        ? Number(data.responseCode)
        : (data?.Code ?? data?.code);

    if (code && code !== 200) {
      const errMsg =
        data?.responsemessage ||
        data?.ResponseMessage ||
        data?.Responsemessage ||
        (data?.Data && data.Data?.MESSAGETEXT) ||
        "Password reset failed";
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("ResetPassword API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
