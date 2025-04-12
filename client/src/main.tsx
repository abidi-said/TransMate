import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet } from "react-helmet";

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>Transmate - Translation Management System</title>
      <meta name="description" content="A comprehensive translation management system with AI-powered translations" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    </Helmet>
    <App />
  </>
);
