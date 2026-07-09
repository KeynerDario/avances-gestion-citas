import { useState, useEffect } from "react";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("sena-theme");
    return saved || "light";
  });

  useEffect(() => {
    localStorage.setItem("sena-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.className = theme === "dark" ? "dark" : "";
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
