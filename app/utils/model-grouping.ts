export interface GroupedItems<T> {
  [groupName: string]: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
}

export interface ModelGroup {
  name: string;
  prefix: string;
  displayName: string;
}

const MODEL_GROUPS: ModelGroup[] = [
  { name: "gpt", prefix: "gpt-", displayName: "GPT Models" },
  { name: "claude", prefix: "claude-", displayName: "Claude Models" },
  { name: "gemini", prefix: "gemini-", displayName: "Gemini Models" },
  { name: "deepseek", prefix: "deepseek-", displayName: "DeepSeek Models" },
  { name: "llama", prefix: "llama-", displayName: "Llama Models" },
  { name: "qwen", prefix: "qwen-", displayName: "Qwen Models" },
  { name: "yi", prefix: "yi-", displayName: "Yi Models" },
];

export function groupItemsByModelPrefix<T>(
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>,
): GroupedItems<T> {
  const grouped: GroupedItems<T> = {};
  const other: typeof items = [];

  items.forEach((item) => {
    const modelName = (item.value as string).toLowerCase();
    let assigned = false;

    for (const group of MODEL_GROUPS) {
      if (modelName.startsWith(group.prefix)) {
        if (!grouped[group.displayName]) {
          grouped[group.displayName] = [];
        }
        grouped[group.displayName].push(item);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      other.push(item);
    }
  });

  if (other.length > 0) {
    grouped["Other Models"] = other;
  }

  return grouped;
}

export function getGroupDisplayOrder(): string[] {
  return [...MODEL_GROUPS.map((g) => g.displayName), "Other Models"];
}
