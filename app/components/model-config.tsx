import { ServiceProvider } from "@/app/constant";
import { ModalConfigValidator, ModelConfig, useAppConfig } from "../store";
import { useState } from "react";
import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { IconButton } from "./button";
import { useFilteredModels } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import SettingsIcon from "../icons/settings.svg";

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const [showModelSelect, setShowModelSelect] = useState(false);
  const config = useAppConfig();
  const { allModels, filteredModels, enabledModels, isNoneSelected } =
    useFilteredModels();
  const groupModels = groupBy(
    filteredModels.filter((v) => v.available),
    "provider.providerName",
  );
  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const compressModelValue = `${props.modelConfig.compressModel}@${props.modelConfig?.compressProviderName}`;

  return (
    <>
      {showModelSelect && (
        <div
          className={styles["model-select-modal"]}
          onClick={() => setShowModelSelect(false)}
        >
          <div
            className={styles["model-select-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: 0 }}>
                {Locale.Settings.EnableModels || "啟用模型"}
              </h4>
              <button
                onClick={() => setShowModelSelect(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "5px",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#666" }}>
                {isNoneSelected
                  ? "未選擇任何模型"
                  : enabledModels.length === 0
                  ? "目前顯示所有模型"
                  : `已選擇 ${enabledModels.length} 個模型`}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    const allModelIds = allModels
                      .filter((m) => m.available)
                      .map((m) => `${m.name}@${m.provider?.id}`);
                    config.updateEnabledModels(allModelIds);
                  }}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  全選
                </button>
                <button
                  onClick={() => {
                    const allModelIds = allModels
                      .filter((m) => m.available)
                      .map((m) => `${m.name}@${m.provider?.id}`);
                    if (enabledModels.length === 0) {
                      // 目前是全選狀態，反選後應該是全部不選
                      config.updateEnabledModels(["_none_"]); // 使用特殊標記表示"無選擇"
                    } else if (
                      enabledModels.length === 1 &&
                      enabledModels[0] === "_none_"
                    ) {
                      // 目前是全不選狀態，反選後應該是全選
                      config.updateEnabledModels(allModelIds);
                    } else {
                      // 正常反選邏輯
                      const invertedModels = allModelIds.filter(
                        (id) => !enabledModels.includes(id),
                      );
                      if (invertedModels.length === 0) {
                        config.updateEnabledModels(["_none_"]);
                      } else {
                        config.updateEnabledModels(invertedModels);
                      }
                    }
                  }}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    background: "#666",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  反選
                </button>
                <button
                  onClick={() => {
                    // 設置一個特殊標記來表示"無選擇"狀態
                    config.updateEnabledModels(["_none_"]);
                  }}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  清空
                </button>
              </div>
            </div>
            <div className={styles["model-list"]}>
              {allModels
                .filter((m) => m.available)
                .map((model) => {
                  const modelId = `${model.name}@${model.provider?.id}`;
                  const isEnabled = isNoneSelected
                    ? false // 如果是"無選擇"狀態，所有都不選中
                    : enabledModels.length === 0 ||
                      enabledModels.includes(modelId);
                  return (
                    <label key={modelId} className={styles["model-item"]}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          let newModels;
                          if (e.target.checked) {
                            if (isNoneSelected) {
                              // 從"無選擇"狀態勾選一個
                              newModels = [modelId];
                            } else if (enabledModels.length === 0) {
                              // 從全選狀態勾選（實際上已經是勾選狀態）
                              newModels = allModels
                                .filter((m) => m.available)
                                .map((m) => `${m.name}@${m.provider?.id}`);
                            } else {
                              // 正常新增
                              newModels = [
                                ...enabledModels.filter(
                                  (id) => id !== "_none_",
                                ),
                                modelId,
                              ];
                            }
                          } else {
                            // 取消勾選
                            if (enabledModels.length === 0) {
                              // 從全選狀態取消一個
                              const allModelIds = allModels
                                .filter((m) => m.available)
                                .map((m) => `${m.name}@${m.provider?.id}`);
                              newModels = allModelIds.filter(
                                (id) => id !== modelId,
                              );
                            } else {
                              // 正常移除
                              newModels = enabledModels.filter(
                                (id) => id !== modelId && id !== "_none_",
                              );
                              // 如果移除後沒有任何選擇，設為"無選擇"狀態
                              if (newModels.length === 0) {
                                newModels = ["_none_"];
                              }
                            }
                          }
                          config.updateEnabledModels(newModels);
                        }}
                      />
                      <span>
                        {model.displayName} ({model.provider?.providerName})
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      <ListItem title={Locale.Settings.Model}>
        <div className={styles["model-select-container"]}>
          <Select
            className={styles["model-select"]}
            aria-label={Locale.Settings.Model}
            value={value}
            align="left"
            onChange={(e) => {
              const [model, providerName] = getModelProvider(
                e.currentTarget.value,
              );
              props.updateConfig((config) => {
                config.model = ModalConfigValidator.model(model);
                config.providerName = providerName as ServiceProvider;
              });
            }}
          >
            {Object.keys(groupModels).map((providerName, index) => (
              <optgroup label={providerName} key={index}>
                {groupModels[providerName].map((v, i) => (
                  <option
                    value={`${v.name}@${v.provider?.providerName}`}
                    key={i}
                  >
                    {v.displayName}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <IconButton
            className={styles["model-settings-button"]}
            icon={<SettingsIcon />}
            onClick={() => setShowModelSelect(!showModelSelect)}
            title={Locale.Settings.EnableModels || "啟用模型"}
            bordered
          />
        </div>
      </ListItem>
      <ListItem
        title={Locale.Settings.Temperature.Title}
        subTitle={Locale.Settings.Temperature.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.Temperature.Title}
          value={props.modelConfig.temperature?.toFixed(1)}
          min="0"
          max="1" // lets limit it to 0-1
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.temperature = ModalConfigValidator.temperature(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.TopP.Title}
        subTitle={Locale.Settings.TopP.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.TopP.Title}
          value={(props.modelConfig.top_p ?? 1).toFixed(1)}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            props.updateConfig(
              (config) =>
                (config.top_p = ModalConfigValidator.top_p(
                  e.currentTarget.valueAsNumber,
                )),
            );
          }}
        ></InputRange>
      </ListItem>
      <ListItem
        title={Locale.Settings.MaxTokens.Title}
        subTitle={Locale.Settings.MaxTokens.SubTitle}
      >
        <input
          aria-label={Locale.Settings.MaxTokens.Title}
          type="number"
          min={1024}
          max={512000}
          value={props.modelConfig.max_tokens}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.max_tokens = ModalConfigValidator.max_tokens(
                  e.currentTarget.valueAsNumber,
                )),
            )
          }
        ></input>
      </ListItem>

      {props.modelConfig?.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            title={Locale.Settings.PresencePenalty.Title}
            subTitle={Locale.Settings.PresencePenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.PresencePenalty.Title}
              value={props.modelConfig.presence_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.presence_penalty =
                      ModalConfigValidator.presence_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.FrequencyPenalty.Title}
            subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.FrequencyPenalty.Title}
              value={props.modelConfig.frequency_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                props.updateConfig(
                  (config) =>
                    (config.frequency_penalty =
                      ModalConfigValidator.frequency_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
          >
            <input
              aria-label={Locale.Settings.InjectSystemPrompts.Title}
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                    (config.enableInjectSystemPrompts =
                      e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={Locale.Settings.InputTemplate.SubTitle}
          >
            <input
              aria-label={Locale.Settings.InputTemplate.Title}
              type="text"
              value={props.modelConfig.template}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.template = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.HistoryCount.Title}
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          aria-label={Locale.Settings.CompressThreshold.Title}
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          aria-label={Locale.Memory.Title}
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.CompressModel.Title}
        subTitle={Locale.Settings.CompressModel.SubTitle}
      >
        <Select
          className={styles["select-compress-model"]}
          aria-label={Locale.Settings.CompressModel.Title}
          value={compressModelValue}
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            props.updateConfig((config) => {
              config.compressModel = ModalConfigValidator.model(model);
              config.compressProviderName = providerName as ServiceProvider;
            });
          }}
        >
          {filteredModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
    </>
  );
}
