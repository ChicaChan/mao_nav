const API_BASE = import.meta.env.VITE_BLOG_API_BASE || "http://localhost:3001/api";

function getAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD || "";
}

async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Admin-Password": getAdminPassword(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error = {};
      try {
        error = await response.json();
      } catch {
        // Ignore non-JSON error body.
      }
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export async function healthCheck() {
  try {
    return await request(`${API_BASE}/health`);
  } catch {
    throw new Error("Cannot connect to blog API service. Please start the backend first.");
  }
}

export async function listBlogPosts() {
  const data = await request(`${API_BASE}/posts`);
  return data.posts || [];
}

export async function getBlogPost(filename) {
  return await request(`${API_BASE}/posts/${filename}`);
}

export async function createBlogPost(filename, content) {
  return await request(`${API_BASE}/posts`, {
    method: "POST",
    body: JSON.stringify({ filename, content }),
  });
}

export async function updateBlogPost(filename, content) {
  return await request(`${API_BASE}/posts/${filename}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteBlogPost(filename) {
  return await request(`${API_BASE}/posts/${filename}`, {
    method: "DELETE",
  });
}
