// components/Alert.js
import React from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";

export function Alert({ variant = "default", className = "", children }) {
  return (
      <div
            className={`rounded-md border p-4 ${className}`}
                  role="alert"
                      >
                            <div className="flex items-start gap-2">{children}</div>
                                </div>
                                  );
                                  }

                                  export function AlertTitle({ children, className = "" }) {
                                    return <div className={`font-semibold ${className}`}>{children}</div>;
                                    }

                                    export function AlertDescription({ children, className = "" }) {
                                      return <div className={`text-sm ${className}`}>{children}</div>;
                                      }