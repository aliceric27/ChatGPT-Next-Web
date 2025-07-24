import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    return collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}

export function useFilteredModels() {
  const allModels = useAllModels();
  const config = useAppConfig();
  const enabledModels = config.enabledModels;

  const filteredModels = useMemo(() => {
    const isNoneSelected =
      enabledModels.length === 1 && enabledModels[0] === "_none_";

    if (isNoneSelected) {
      return []; // 如果是"無選擇"狀態，不顯示任何模型
    } else if (enabledModels.length > 0 && !enabledModels.includes("_none_")) {
      return allModels.filter((m) =>
        enabledModels.includes(`${m.name}@${m.provider?.id}`),
      );
    }

    return allModels; // 預設顯示所有模型
  }, [allModels, enabledModels]);

  return {
    allModels,
    filteredModels,
    enabledModels,
    isNoneSelected: enabledModels.length === 1 && enabledModels[0] === "_none_",
  };
}
