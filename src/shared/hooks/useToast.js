import { toast } from "sonner";

export const useToast = () => {
  const success = (message) => {
    toast.success(message);
  };

  const error = (message) => {
    toast.error(message);
  };

  const info = (message) => {
    toast.info(message);
  };

  const warning = (message) => {
    toast.warning(message);
  };

  return { success, error, info, warning };
};
