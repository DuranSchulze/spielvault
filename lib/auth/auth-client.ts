"use client";

import { createAuthClient } from "better-auth/react";

const clientBaseURL =
  process.env.NEXT_PUBLIC_APP_URL &&
  process.env.NEXT_PUBLIC_APP_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_APP_URL
    : undefined;

export const authClient = createAuthClient(
  clientBaseURL ? { baseURL: clientBaseURL } : {},
);

export const { signIn, signUp, signOut, useSession } = authClient;
