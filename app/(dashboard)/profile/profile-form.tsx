"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

type ProfileFormProps = {
  name: string;
  email: string;
  role: string;
  companyName: string | null;
};

export function ProfileForm({
  name: initialName,
  email,
  role,
  companyName,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setIsSavingProfile(true);

    const result = await authClient.updateUser({
      name: name.trim(),
    });

    setIsSavingProfile(false);

    if (result.error) {
      setProfileError("Unable to update your profile.");
      return;
    }

    setProfileMessage("Profile updated.");
    router.refresh();
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    setIsSavingPassword(true);

    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setIsSavingPassword(false);

    if (result.error) {
      setPasswordError(
        "Unable to change password. Check your current password and try again.",
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setPasswordMessage("Password updated. Other sessions were revoked.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-md border border-border bg-card p-6"
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the basic details tied to your account.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Full Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email Address
            </span>
            <input
              value={email}
              readOnly
              className="w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Role
              </span>
              <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                {role}
              </div>
            </div>
            <div className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Company
              </span>
              <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                {companyName ?? "Not assigned"}
              </div>
            </div>
          </div>
        </div>

        {profileError && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {profileError}
          </p>
        )}
        {profileMessage && (
          <p className="mt-4 text-sm text-green-600">{profileMessage}</p>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSavingProfile || !name.trim()}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-md border border-border bg-card p-6"
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          Security
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Change your password and revoke other active sessions.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Current Password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              New Password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>

        {passwordError && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {passwordError}
          </p>
        )}
        {passwordMessage && (
          <p className="mt-4 text-sm text-green-600">{passwordMessage}</p>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSavingPassword || !currentPassword || !newPassword}
            className="inline-flex items-center rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSavingPassword ? "Updating..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
