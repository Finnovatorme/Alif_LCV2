import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">

            <div className="bg-muted relative hidden lg:block">
                <img
                    src="/assets/skyline.png"
                    alt="Image"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-end">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <img
                            src="/assets/FULL-LOGO.png"
                            alt="Image"
                            className="inset-0 h-15 w-15 object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <SignupForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
