import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add title and meta description for SEO
document.title = "TaskFlow - Team Task Management";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "TaskFlow - A team task management system for organizing, assigning, and tracking tasks efficiently.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
