import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept both "userName" and "userId" from the frontend
    const payload = {
      userName: body.userName ?? body.userId,
      email: body.email,
      idNumber: body.idNumber,
      mobileNo: body.mobileNo,
    };

    console.log("[ForgotPasswordScreen] Sending payload to backend:", payload);

    const bsResponse = await fetch(
      `${process.env.BS_API_KEY}/api/Authentication/ForgotPasswordScreen`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await bsResponse.text();
    console.log("[ForgotPasswordScreen] Raw backend response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!bsResponse.ok) {
      const errMsg =
        data?.ResponseMessage ||
        data?.Responsemessage ||
        data?.message ||
        data?.error ||
        "Recovery request failed";

      console.error("[ForgotPasswordScreen] Backend error:", bsResponse.status, errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: bsResponse.status }
      );
    }

    // Some backends return 200 but Code != 200
    const code = data?.Code ?? data?.code;
    if (code && code !== 200) {
      const errMsg =
        data?.ResponseMessage ||
        data?.Responsemessage ||
        data?.Data?.MESSAGETEXT ||
        "Recovery request failed";
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Recovery API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
