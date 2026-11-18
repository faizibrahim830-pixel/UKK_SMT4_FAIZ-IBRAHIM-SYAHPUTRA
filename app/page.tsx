"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MenuLandingPage } from "@/components/landing-page-menu";
import { Button } from "@/components/ui/button";
import { LandingPageHero } from "@/components/landing-page-hero";
import { SearchIcon, X } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useState, type FormEvent } from "react";

export default function Home() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Login gagal.");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login gagal.");
      setIsLoggingIn(false);
    }
  }

  return (
    <main className="relative w-full bg-white dark:bg-black">
      <div className="relative z-0 -mt-[96px]">
        <LandingPageHero />
      </div>
      <div className="absolute top-0 left-0 z-10 w-full flex justify-center">
        <div className="mx-auto mt-4 flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 shadow-lg shadow-slate-950/20 sm:mx-5 sm:px-4 md:mx-8 md:h-[80px] md:w-[95%] md:rounded-[70px] md:p-4">
          {/* logo */}
          <div className="relative h-9 w-36 shrink-0 items-center justify-start sm:h-10 sm:w-44 md:h-[50px] md:w-[200px]">
            <Image
              className="p-[1px]"
              src="/img/smk_mvp_ars_logo_white.png"
              alt="logo"
              fill
            />
          </div>
          {/* menu */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <MenuLandingPage />
          </div>
          {/* login */}
          <div className="flex items-center justify-end md:p-4">
            <Button
              onClick={() => setIsLoginOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-slate-100 md:px-5 md:py-3 md:text-base"
              size="lg"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[500px] rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup form login"
              onClick={() => {
                setIsLoginOpen(false);
                setLoginError("");
              }}
              className="absolute right-3 top-3"
            >
              <X />
            </Button>
            <form onSubmit={handleLogin}>
              <Field className="w-full space-y-4 pt-2">
                <FieldLabel htmlFor="email-input">Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="email-input"
                    type="email"
                    autoComplete="username"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                <FieldLabel htmlFor="password-input">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password-input"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
                {loginError && <p role="alert" className="text-sm text-destructive">{loginError}</p>}
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Memproses..." : "Login"}
                </Button>
              </Field>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
