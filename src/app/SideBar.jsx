'use client';

import React from "react";
import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className="sidebar-menu-item">
          <Link href="/">Live Feed</Link>
        </li>
        <li className="sidebar-menu-item">
          <Link href="/cameras">Cameras</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
