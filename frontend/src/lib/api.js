import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// ── Category Code ─────────────────────────────────────────────────────────────

export async function getCategoryByCode(code) {
  const { data } = await axios.get(`${API}/category/code/${code.trim().toUpperCase()}`);
  return data; // { type: "admin"|"community", category: {...} }
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getFavorites(token) {
  const { data } = await axios.get(`${API}/favorites`, authHeader(token));
  return data;
}

export async function addFavorite(token, categoryId, categoryType = "admin") {
  const { data } = await axios.post(
    `${API}/favorites/add`,
    { category_id: categoryId, category_type: categoryType },
    authHeader(token)
  );
  return data;
}

export async function removeFavorite(token, categoryId, categoryType = "admin") {
  const { data } = await axios.delete(`${API}/favorites/remove`, {
    ...authHeader(token),
    data: { category_id: categoryId, category_type: categoryType },
  });
  return data;
}
