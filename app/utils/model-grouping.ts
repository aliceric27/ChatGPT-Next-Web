export interface GroupedItems<T> {
  [groupName: string]: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
}

export interface ProviderInfo {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export interface ModelWithProvider {
  title: string;
  subTitle?: string;
  value: any;
  disable?: boolean;
  provider?: ProviderInfo;
}

export function groupItemsByProvider<T>(
  items: Array<ModelWithProvider>,
): GroupedItems<T> {
  const grouped: GroupedItems<T> = {};
  const other: Array<ModelWithProvider> = [];

  items.forEach((item) => {
    if (item.provider && item.provider.providerName) {
      const groupName = item.provider.providerName;
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(item);
    } else {
      other.push(item);
    }
  });

  if (other.length > 0) {
    grouped["Other Models"] = other;
  }

  return grouped;
}

export function getGroupDisplayOrder(
  items: Array<ModelWithProvider>,
): string[] {
  // Extract unique providers from items and sort by their sorted property
  const providerMap = new Map<string, number>();

  items.forEach((item) => {
    if (item.provider && item.provider.providerName) {
      providerMap.set(item.provider.providerName, item.provider.sorted);
    }
  });

  // Sort providers by their sorted property
  const sortedProviders = Array.from(providerMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([providerName]) => providerName);

  return [...sortedProviders, "Other Models"];
}
