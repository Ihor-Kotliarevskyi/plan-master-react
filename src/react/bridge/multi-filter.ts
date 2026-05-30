type MultiFilterWindow = Window & {
  openMultiFilter?: (path: string, summaryEl?: HTMLElement | null, event?: Event | null) => void;
  resetMultiFilter?: (path: string, renderFnName: string) => void;
  setMultiFilter?: (path: string, option: string, checked: boolean, renderFnName: string) => void;
};

function getMultiFilterWindow(): MultiFilterWindow {
  return window as MultiFilterWindow;
}

export function openReactMultiFilter(path: string, summaryEl?: HTMLElement | null, event?: Event | null): void {
  getMultiFilterWindow().openMultiFilter?.(path, summaryEl, event);
}

export function resetReactMultiFilter(path: string, renderFnName: string): void {
  getMultiFilterWindow().resetMultiFilter?.(path, renderFnName);
}

export function setReactMultiFilter(path: string, option: string, checked: boolean, renderFnName: string): void {
  getMultiFilterWindow().setMultiFilter?.(path, option, checked, renderFnName);
}
