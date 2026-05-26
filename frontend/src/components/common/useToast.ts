import { useCallback } from "react";
import { useAppDispatch } from "../../store";
import { pushToast } from "../../store/uiSlice";

export function useToast() {
  const dispatch = useAppDispatch();
  return useCallback(
    (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      dispatch(pushToast({ id, message, type }));
    },
    [dispatch],
  );
}
