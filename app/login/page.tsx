import { LoginForm } from "@/components/auth/login-form";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { GradualSpacing } from "@/components/ui/framerheading";
import MotionLogo from "@/components/ui/framerlogo";
import LoginBackgroundSvg from "@/components/ui/loginbackgroundSvg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const authCookies = await cookies();

  const authToken = authCookies.get("auth_token")?.value;

  if (authToken) {
    redirect("/dashboard", RedirectType.replace);
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 ">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <MotionLogo />
          </a>
        </div>
        <div className="relative flex flex-1 items-center justify-center pb-40 overflow-hidden">
          <div className="text-center space-y-2 relative z-10">
            <div className="w-full max-w-sm space-y-6 pb-16">
              <GradualSpacing text="Loan Origination" />
            </div>
            <LoginForm className="ml-2" />
          </div>
          <LoginBackgroundSvg />
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/assets/image.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
    </div>
  );
}
