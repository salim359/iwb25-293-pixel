import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export const Route = createFileRoute("/_guest/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiClient.post("/pixel/login", data);
      console.log(response.data.token);
      login(response.data.token);
    },

    onError: (error) => {
      console.error("Login error", error);
      toast.error("Failed to log in. Please check your credentials.");
    },

    onSuccess: () => {
      toast.success("Logged in successfully! Redirecting...");
      navigate({ to: "/" });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    loginMutation.mutate(data);
  }

  const formSchema = z.object({
    email: z.email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be at most 100 characters long"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-md shadow-md p-4 md:p-8 border border-neutral-100 relative overflow-hidden">
        {/* Back Button */}
        <Link to="/" className="w-fit">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft />
          </Button>
        </Link>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Logo" className="w-16 h-16" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Log in to your account
          </h1>
          <p className="text-muted-foreground text-base">
            Welcome back! Please enter your credentials.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loginMutation.isPending}>
              Log in
            </Button>
          </form>
        </Form>
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 text-muted-foreground text-xs uppercase tracking-wider">
            or
          </span>
          <div className="flex-grow border-t border-border" />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
