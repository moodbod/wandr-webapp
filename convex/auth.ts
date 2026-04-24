import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (!email) {
          throw new Error("Email is required");
        }

        const flow = String(params.flow ?? "");
        const name = String(params.name ?? "").trim();

        return {
          email,
          ...(flow === "signUp" ? { name: name || "Traveler", role: "traveler" as const } : {}),
        };
      },
    }),
  ],
});
