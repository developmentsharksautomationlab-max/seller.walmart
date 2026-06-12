import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Create account — SalesHub",
};

export default function SignupPage() {
  return <SignupForm />;
}
