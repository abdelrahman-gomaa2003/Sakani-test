import { createContext, useState, useCallback } from "react";

const CompareContext = createContext(null);
const MAX_COMPARE = 3;
const STORAGE_KEY = "sakani_compare";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
}

export function CompareProvider({ children }) {
  const [compareIds, setCompareIds] = useState(loadFromStorage);

  const toggleCompare = useCallback((apt) => {
    setCompareIds((prev) => {
      const exists = prev.find((a) => a.id === apt.id);
      let next;
      if (exists) {
        next = prev.filter((a) => a.id !== apt.id);
      } else if (prev.length >= MAX_COMPARE) {
        return prev;
      } else {
        next = [...prev, { id: apt.id, title: apt.title, image: apt.images?.[0] || apt.image, price: apt.price, neighborhood: apt.neighborhood, city: apt.city, bedrooms: apt.bedrooms, bathrooms: apt.bathrooms, area: apt.area, university: apt.university, apartment_type: apt.apartment_type, wifi: apt.wifi, gas: apt.gas, furnished: apt.furnished, rating: apt.rating, reviews_count: apt.reviews_count }];
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeCompare = useCallback((id) => {
    setCompareIds((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    saveToStorage([]);
  }, []);

  const isComparing = useCallback((id) => compareIds.some((a) => a.id === id), [compareIds]);

  return (
    <CompareContext.Provider value={{ compareIds, toggleCompare, removeCompare, clearCompare, isComparing, maxCompare: MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export default CompareContext;
