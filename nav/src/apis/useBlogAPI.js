export function useBlogAPI() {
  const API_BASE = import.meta.env.VITE_BLOG_API_BASE || "http://localhost:3001/api";

  const getAdminPassword = () => {
    return import.meta.env.VITE_ADMIN_PASSWORD || "";
  };

  const request = async (url, options = {}) => {
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
        let errorPayload = {};
        try {
          errorPayload = await response.json();
        } catch {
          // Ignore JSON parse error for non-JSON responses.
        }

        throw new Error(
          errorPayload.error || errorPayload.message || `HTTP ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

  const healthCheck = async () => {
    try {
      return await request(`${API_BASE}/health`);
    } catch {
      throw new Error("Cannot connect to blog API service. Please start the backend first.");
    }
  };

  const listBlogPosts = async () => {
    const data = await request(`${API_BASE}/posts`);
    return data.posts || [];
  };

  const getBlogPost = async (filename) => {
    return await request(`${API_BASE}/posts/${filename}`);
  };

  const createBlogPost = async (filename, content) => {
    return await request(`${API_BASE}/posts`, {
      method: "POST",
      body: JSON.stringify({ filename, content }),
    });
  };

  const updateBlogPost = async (filename, content) => {
    return await request(`${API_BASE}/posts/${filename}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  };

  const deleteBlogPost = async (filename) => {
    return await request(`${API_BASE}/posts/${filename}`, {
      method: "DELETE",
    });
  };

  return {
    healthCheck,
    listBlogPosts,
    getBlogPost,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
  };
}
