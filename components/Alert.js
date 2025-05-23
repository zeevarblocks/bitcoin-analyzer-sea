// components/Alert.js
import React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";

const variantStyles = {
  default: "bg-gray-50 border-gray-200 text-gray-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

const variantIcons = {
  default: <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-yellow-500" />,
  error: <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />,
};

export function Alert({ variant = "default", className = "", children }) {
  return (
    <div
      className={`rounded-md border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        {variantIcons[variant]}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function AlertTitle({ children, className = "" }) {
  return <div className={`font-semibold ${className}`}>{children}</div>;
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
  }
