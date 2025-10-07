"use client";

import { toast as toastify, ToastOptions } from "react-toastify";
import { ThemeAwareToast } from "@/components/theme";

type ToastType = "success" | "error" | "info" | "warning";
type ToastPosition = "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";

interface ToastConfig extends Partial<ToastOptions> {
  position?: ToastPosition;
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
}

const defaultConfig: ToastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const Toast = {
  Container: ThemeAwareToast,
  
  success: (message: string, config: ToastConfig = {}) => {
    return toastify.success(message, { ...defaultConfig, ...config });
  },
  
  error: (message: string, config: ToastConfig = {}) => {
    return toastify.error(message, { ...defaultConfig, ...config });
  },
  
  info: (message: string, config: ToastConfig = {}) => {
    return toastify.info(message, { ...defaultConfig, ...config });
  },
  
  warning: (message: string, config: ToastConfig = {}) => {
    return toastify.warning(message, { ...defaultConfig, ...config });
  },
  
  custom: (message: string, type: ToastType, config: ToastConfig = {}) => {
    switch (type) {
      case "success":
        return Toast.success(message, config);
      case "error":
        return Toast.error(message, config);
      case "info":
        return Toast.info(message, config);
      case "warning":
        return Toast.warning(message, config);
      default:
        return toastify(message, { ...defaultConfig, ...config });
    }
  },
  
  dismiss: (id?: string | number) => {
    toastify.dismiss(id);
  },
  
  dismissAll: () => {
    toastify.dismiss();
  }
}; 