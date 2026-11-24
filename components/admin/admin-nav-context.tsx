"use client";

import { createContext, useContext } from "react";

/* Lets a page's header open the mobile drawer that the admin layout owns,
   without every page having to thread a prop down from the layout. */
export const AdminNavContext = createContext<{ openNav: () => void }>({
  openNav: () => {},
});

export function useAdminNav() {
  return useContext(AdminNavContext);
}
