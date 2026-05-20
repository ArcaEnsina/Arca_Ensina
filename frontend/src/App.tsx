import { RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import router from "@/routes";

export default function App() {
  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}
