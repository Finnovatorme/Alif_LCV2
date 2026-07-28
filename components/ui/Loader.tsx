"use client";

import React from "react";

interface LoaderProps {
  size?: number;
  className?: string;
}

const sizeMap: Record<number, string> = {
  24: "w-6 h-6",
  32: "w-8 h-8",
  48: "w-12 h-12",
  64: "w-16 h-16",
  96: "w-24 h-24",
  128: "w-32 h-32",
  150: "w-[150px] h-[150px]",
  200: "w-[200px] h-[200px]",
};

const Loader: React.FC<LoaderProps> = ({ size = 150, className = "" }) => {
  const sizeClass = sizeMap[size] || "w-[150px] h-[150px]";

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-black z-50">
      <img
        src="/assets/Loading.gif"
        alt="Loading..."
        className={`${sizeClass} ${className}`}
      />
    </div>
  );
};

export default Loader;
