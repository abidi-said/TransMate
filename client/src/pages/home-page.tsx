import { useEffect } from "react";
import { Redirect } from "wouter";

export default function HomePage() {
  useEffect(() => {
    document.title = "Transmate - Home";
  }, []);

  // Redirect to the dashboard page
  return <Redirect to="/dashboard" />;
}
