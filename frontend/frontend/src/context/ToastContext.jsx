import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import Toast from "../components/UI/Toast";
import ToastContainer from "../components/UI/ToastContainer";

const ToastContext = createContext();

export function ToastProvider({ children }) {

  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(

    ({
      type = "success",
      title,
      message,
      duration = 4000,
    }) => {

      const id = Date.now() + Math.random();

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, duration);

    },

    [removeToast]

  );

  return (

    <ToastContext.Provider value={{ showToast }}>

      {children}

      <ToastContainer>

        {toasts.map((toast) => (

          <Toast

            key={toast.id}

            {...toast}

            onClose={() =>
              removeToast(toast.id)
            }

          />

        ))}

      </ToastContainer>

    </ToastContext.Provider>

  );

}

export function useToast() {

  return useContext(ToastContext);

}