/**
 * 博客文章本地 API
 * 调用本地后端服务，直接操作文件系统
 */

const API_BASE = 'http://localhost:3001/api'

// 获取管理员密码（用于认证）
function getAdminPassword() {
  return import.meta.env.VITE_ADMIN_PASSWORD || ''
}

// 通用请求方法
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Password': getAdminPassword(),
    ...options.headers
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API 请求失败:', error)
    throw error
  }
}

// 健康检查
export async function healthCheck() {
  try {
    return await request(`${API_BASE}/health`)
  } catch (error) {
    throw new Error('无法连接到后端服务，请确保已启动 npm run server')
  }
}

// 列出所有博客文章
export async function listBlogPosts() {
  try {
    const data = await request(`${API_BASE}/posts`)
    return data.posts || []
  } catch (error) {
    console.error('列出博客文章失败:', error)
    throw error
  }
}

// 获取单篇博客文章
export async function getBlogPost(filename) {
  try {
    return await request(`${API_BASE}/posts/${filename}`)
  } catch (error) {
    console.error('获取博客文章失败:', error)
    throw error
  }
}

// 创建博客文章
export async function createBlogPost(filename, content) {
  try {
    return await request(`${API_BASE}/posts`, {
      method: 'POST',
      body: JSON.stringify({ filename, content })
    })
  } catch (error) {
    console.error('创建博客文章失败:', error)
    throw error
  }
}

// 更新博客文章
export async function updateBlogPost(filename, content) {
  try {
    return await request(`${API_BASE}/posts/${filename}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    })
  } catch (error) {
    console.error('更新博客文章失败:', error)
    throw error
  }
}

// 删除博客文章
export async function deleteBlogPost(filename) {
  try {
    return await request(`${API_BASE}/posts/${filename}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.error('删除博客文章失败:', error)
    throw error
  }
}
