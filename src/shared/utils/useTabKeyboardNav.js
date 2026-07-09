import { useCallback } from "react";

export function useTabKeyboardNav(tabIds, activeTab, setActiveTab) {
  const onKeyDown = useCallback((e) => {
    const currentIndex = tabIds.indexOf(activeTab);
    let nextIndex;

    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabIds.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(tabIds[nextIndex]);
  }, [tabIds, activeTab, setActiveTab]);

  return onKeyDown;
}
