import { AuthScreen } from "@/components/auth/auth-screen";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  if (await isAuthenticated()) {
    redirect("/explore");
  }

  return <AuthScreen />;
}
