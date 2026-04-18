import { v } from "convex/values";
import { query } from "./_generated/server";

export const inspectAuthByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", normalizedEmail),
      )
      .unique();

    return {
      user,
      account,
      linkedUser: account ? await ctx.db.get(account.userId) : null,
    };
  },
});

export const inspectRecentAuthState = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(10);
    const accounts = await ctx.db.query("authAccounts").take(10);

    return {
      users,
      accounts,
    };
  },
});
