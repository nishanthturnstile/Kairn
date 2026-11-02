import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router.js";
import "./styles.css";

const element = document.getElementById("root");
if (!element) throw new Error("Missing application root.");
createRoot(element).render(<RouterProvider router={createAppRouter()} />);
