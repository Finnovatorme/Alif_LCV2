import { ResetPasswordForm } from "@/components/auth/reset-password";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import MotionLogo from "@/components/ui/framerlogo";
import LoginBackgroundSvg from "@/components/ui/loginbackgroundSvg";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; userName?: string; userId?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  // If already logged in, go to dashboard
  const authCookies = await cookies();
  const authToken = authCookies.get("auth_token")?.value;
  if (authToken) {
    redirect("/dashboard", RedirectType.replace);
  }

  const params = await searchParams;
  const token = params.token ?? "";
  const userName = params.userName ?? params.userId ?? "";

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <MotionLogo />
          </a>
        </div>
        <div className="relative flex flex-1 items-center justify-center pb-40 overflow-hidden">
          <div className="text-center space-y-2 relative z-10 w-full max-w-sm">
            <ResetPasswordForm token={token} userName={userName} />
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
