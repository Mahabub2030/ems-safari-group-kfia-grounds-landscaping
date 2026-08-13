import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { ThemeProvider } from "./providers/theme.provider";
import { router } from "./routes";
import { TooltipProvider } from "./components/ui/tooltip";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
 <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
    </TooltipProvider>

  </StrictMode>,
);
