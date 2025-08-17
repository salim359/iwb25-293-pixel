import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "../assets/logo.svg";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiClient.post("/pixel/signup", data);
      return response.data;
    },
    onError: (error) => {
      console.error("Signup error", error);
      toast.error("Failed to create account. Please try again.");
    },
    onSuccess: () => {
      toast.success("Account created successfully! Redirecting to login...");
      navigate({
        to: "/login",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    signupMutation.mutate(data);
  }

  const formSchema = z.object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(50, "Username must be at most 50 characters"),
    email: z.email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be at most 100 characters long"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
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
            Create your account
          </h1>
          <p className="text-muted-foreground text-base">
            Sign up to get started. It's fast and easy.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john_doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

            <Button type="submit">Sign up</Button>
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
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Log in
          </a>
        </div>
        {/* No decorative gradients */}
      </div>
    </div>
  );
}
