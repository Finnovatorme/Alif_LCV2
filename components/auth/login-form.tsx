"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NotificationSnackBar from "@/components/ui/NotificationSnackBar";
import { useDispatch, useSelector } from "react-redux";
import { responseModal } from "@/lib/redux/slices/snackbarSlice";
import { Loader } from "../ui/icons";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react"; // Eye icons for toggle
import { RecoveryModal } from "./recovery-modal";
import { encryptData } from "@/utils/dataSecurity/encrypt";
import { encryptToken } from "@/utils/dataSecurity/encryptToken";
import { decryptDetails } from "@/utils/dataSecurity/decrypt";
import { languageParams } from "@/lib/redux/slices/dashboardApplSlice";

const formSchema = z.object({
  username: z
    .string()
    .trim() // removes start/end spaces
    .min(4, "Username must be at least 4 characters")
    .regex(
      /^[a-zA-Z0-9]+$/,
      "Username cannot contain spaces or special characters",
    ),

  password: z
    .string()
    .trim() // removes start/end spaces
    .min(6, "Password must be at least 6 characters"),

  rememberMe: z.boolean().optional(),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { setUser } = useAuth(); // hook se
  const [showPassword, setShowPassword] = useState(false); // <--- NEW STATE
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const language = useSelector(languageParams) || "en";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Initialize form with values from localStorage on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberedUsername");
    const rememberedPass = localStorage.getItem("rememberedPassword");
    if (rememberedUser) {
      form.setValue("username", rememberedUser);
      if (rememberedPass) {
        form.setValue("password", rememberedPass);
      }
      form.setValue("rememberMe", true);
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    // Handle Remember Me logic
    if (values.rememberMe) {
      localStorage.setItem("rememberedUsername", values.username);
      localStorage.setItem("rememberedPassword", values.password);
    } else {
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberedPassword");
    }
    try {
      const formattedData = {
        Userid: values.username,
        Password: values.password,
        moduleId: 1,
        language: language,
      };

      const encryptedLoginData = await encryptData(formattedData);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: encryptedLoginData,
          isEncrypted: true,
          rememberMe: values.rememberMe,
        }),
      });

      const responseData = await response.json();
      let data = responseData.data;

      // Robust check for encrypted data
      if (data && typeof data === "object" && data.payload) {
        data = data.payload;
      }

      if (typeof data === "string") {
        data = await decryptDetails(data);
      }

      // Normalize data if it comes from the encrypted backend response
      if (data && data.Code === 200) {
        const userData = Array.isArray(data.Data) ? data.Data[0] : data.Data;
        data = {
          token: data.Token || data.token,
          userId: (userData?.Userid || userData?.UserId || userData?.USERID) ?? "",
          Username1: (userData?.Username1 || userData?.USERNAME1) ?? "",
          Email: (userData?.Email || userData?.EMAIL) ?? "",
          ...userData,
        };
      }

      if (data && (data.token || data.Token)) {
        const token = data.token || data.Token;
        const userId = data.userId || data.Userid || data.UserId || data.USERID;
        const username = data.Username1 || data.USERNAME1 || data.userName || data.UserName || userId;
        const email = data.Email || data.EMAIL || data.email || "";

        const userDataToSet = {
          token: token,
          userId: userId,
          Username1: username,
          Email: email,
        };

        // Encrypt for storage
        const encryptedTokenString = await encryptToken(token);
        const encryptedUserString = await encryptToken(userDataToSet);

        setUser(userDataToSet);

        // Store encrypted values
        if (values.rememberMe) {
          localStorage.setItem("AccessToken", encryptedTokenString);
          localStorage.setItem("userToken", encryptedUserString);
        } else {
          sessionStorage.setItem("AccessToken", encryptedTokenString);
          sessionStorage.setItem("userToken", encryptedUserString);
        }

        // Use hard redirect if router.replace feels slow or get blocked
        window.location.href = "/dashboard";
        setLoading(false);
        return;
      }

      // If we reach here, we did not get a token, meaning the login failed.
      const errorMsg =
        data?.Responsemessage ||
        data?.ResponseMessage ||
        (data?.Data && typeof data.Data === "object" && !Array.isArray(data.Data) && data.Data.MESSAGETEXT) ||
        data?.error ||
        data?.Status ||
        "Incorrect credentials";

      dispatch(
        responseModal({
          message: errorMsg,
          variant: "error",
          display: true,
        }),
      );
      setErrorMessage(errorMsg);
      setLoading(false);
      return;
    } catch (error) {
      console.error("Error during login:", error);
      dispatch(
        responseModal({
          message: "An error occurred during login. Please check your credentials.",
          variant: "error",
          display: true,
        }),
      );
      setErrorMessage("An error occurred during login. Please check your credentials.");
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <NotificationSnackBar />
      <Card className="border border-[#53a4e2] dark:border-[#53a4e2] w-87.5 min-h-105 ml-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription className="text-xl text-black font-bold dark:text-white">
            Enter your Credential
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="text-center mb-4 rounded-lg border p-3 text-sm shadow-sm border-red-500 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <p className="font-medium">Error</p>
              <p>{errorMessage}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel>Password</FormLabel>
                        <button
                          type="button"
                          onClick={() => setIsRecoveryOpen(true)}
                          className="text-sm underline-offset-4 hover:underline cursor-pointer"
                        >
                          Forgot your password?
                        </button>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="********"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-center gap-2 [&_input[type='checkbox']]:hidden">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal m-0!">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className={`w-full ${loading
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                    }`}
                >
                  {loading ? <Loader color="#fff" /> : <>Sign in</>}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <RecoveryModal open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen} />
    </div>
  );
}
