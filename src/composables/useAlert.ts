import { reactive } from "vue";
import { useI18n } from "vue-i18n";
import type { AlertState } from "@/types";

export function useAlert() {
  const { t } = useI18n();

  const alertState = reactive<AlertState>({
    type: undefined,
    text: "",
    show: false
  });

  const showAlert = (
    message: string,
    type: AlertState["type"],
    timeout?: number
  ): void => {
    alertState.text = message;
    alertState.type = type;
    alertState.show = true;

    if (timeout) {
      setTimeout(() => {
        alertState.show = false;
      }, timeout);
    }
  };

  const copyToClipboardSuccessHandler = (): void => {
    showAlert(t("copiedSuccess"), "success", 2000);
  };

  const copyToClipboardErrorHandler = (error: Error): void => {
    showAlert(t("copyError"), "error", 2000);
    console.error(error);
  };

  const hideAlert = (): void => {
    alertState.show = false;
  };

  return {
    alertState,
    showAlert,
    copyToClipboardSuccessHandler,
    copyToClipboardErrorHandler,
    hideAlert
  };
}
