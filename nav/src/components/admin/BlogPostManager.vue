<template>
  <div class="blog-post-manager">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <button @click="loadPosts" class="btn btn-secondary" :disabled="loading">
        {{ loading ? '加载中...' : '🔄 刷新列表' }}
      </button>
      <button @click="showCreateDialog" class="btn btn-primary">
        ➕ 创建新文章
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在加载文章列表...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadPosts" class="btn btn-secondary">重试</button>
    </div>

    <!-- 文章列表 -->
    <div v-if="!loading && !error" class="posts-list">
      <div v-if="posts.length === 0" class="empty-state">
        <p>📝 还没有文章，点击"创建新文章"开始写作吧！</p>
      </div>

      <div v-else class="posts-table">
        <table>
          <thead>
            <tr>
              <th>文件名</th>
              <th>大小</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.sha">
              <td>{{ post.name }}</td>
              <td>{{ formatSize(post.size) }}</td>
              <td class="actions">
                <button @click="editPost(post)" class="btn btn-sm btn-secondary">
                  ✏️ 编辑
                </button>
                <button @click="confirmDelete(post)" class="btn btn-sm btn-danger">
                  🗑️ 删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <CustomDialog
      v-if="showDialog"
      :title="dialogMode === 'create' ? '创建新文章' : '编辑文章'"
      @close="closeDialog"
      @confirm="savePost"
      :confirmText="dialogMode === 'create' ? '创建' : '保存'"
      :loading="saving"
      width="800px"
    >
      <div class="post-form">
        <!-- Frontmatter 表单 -->
        <div class="form-section">
          <h3>📋 文章信息</h3>

          <div class="form-group">
            <label>标题 *</label>
            <input
              v-model="currentPost.title"
              type="text"
              placeholder="请输入文章标题"
              class="form-control"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>发布日期 *</label>
              <input
                v-model="currentPost.published"
                type="date"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>分类 *</label>
              <input
                v-model="currentPost.category"
                type="text"
                placeholder="例如：前端开发"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label>描述 *</label>
            <textarea
              v-model="currentPost.description"
              placeholder="请输入文章描述"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>标签（用逗号分隔）</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="例如：Vue, JavaScript, 教程"
              class="form-control"
            />
          </div>

          <div class="form-row">
            <div class="form-group checkbox-group">
              <label>
                <input v-model="currentPost.pinned" type="checkbox" />
                📌 置顶文章
              </label>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input v-model="currentPost.draft" type="checkbox" />
                📝 草稿状态
              </label>
            </div>
          </div>
        </div>

        <!-- Markdown 编辑器 -->
        <div class="form-section">
          <h3>✍️ 文章内容（Markdown）</h3>
          <textarea
            v-model="currentPost.content"
            placeholder="请输入 Markdown 格式的文章内容..."
            class="form-control markdown-editor"
            rows="15"
          ></textarea>
        </div>

        <!-- 文件名预览 -->
        <div class="form-section">
          <p class="filename-preview">
            📄 文件名：<code>{{ previewFilename }}</code>
          </p>
        </div>
      </div>
    </CustomDialog>

    <!-- 删除确认对话框 -->
    <CustomDialog
      v-if="showDeleteDialog"
      title="确认删除"
      @close="showDeleteDialog = false"
      @confirm="deletePost"
      confirmText="删除"
      :loading="deleting"
      width="400px"
    >
      <p>确定要删除文章 <strong>{{ postToDelete?.name }}</strong> 吗？</p>
      <p class="warning-text">⚠️ 此操作不可恢复！</p>
    </CustomDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBlogAPI } from '@/apis/useBlogAPI'
import {
  parseFrontmatter,
  generateMarkdown,
  generateSlug,
  validateFrontmatter,
  formatDate
} from '@/utils/markdownParser'
import CustomDialog from './CustomDialog.vue'

// 本地 API
const blogAPI = useBlogAPI()

// 状态
const posts = ref([])
const loading = ref(false)
const error = ref(null)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'
const saving = ref(false)
const deleting = ref(false)
const postToDelete = ref(null)

// 当前编辑的文章
const currentPost = ref({
  title: '',
  published: formatDate(new Date()),
  description: '',
  tags: [],
  category: '',
  pinned: false,
  draft: false,
  content: '',
  // 编辑模式下需要的字段
  filename: '',
  sha: ''
})

// 标签输入（用逗号分隔的字符串）
const tagsInput = ref('')

// 预览文件名
const previewFilename = computed(() => {
  if (dialogMode.value === 'edit') {
    return currentPost.value.filename
  }
  if (!currentPost.value.title) {
    return 'untitled.md'
  }
  const slug = generateSlug(currentPost.value.title)
  return `${slug}.md`
})

// 加载文章列表
const loadPosts = async () => {
  loading.value = true
  error.value = null

  try {
    // 先检查后端服务是否运行
    await blogAPI.healthCheck()
    posts.value = await blogAPI.listBlogPosts()
  } catch (err) {
    error.value = err.message
    console.error('加载文章列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  currentPost.value = {
    title: '',
    published: formatDate(new Date()),
    description: '',
    tags: [],
    category: '前端开发',
    pinned: false,
    draft: false,
    content: '',
    filename: '',
    sha: ''
  }
  tagsInput.value = ''
  showDialog.value = true
}

// 编辑文章
const editPost = async (post) => {
  loading.value = true
  error.value = null

  try {
    // 获取文章内容
    const fileData = await blogAPI.getBlogPost(post.name)
    const { frontmatter, content } = parseFrontmatter(fileData.content)

    // 填充表单
    currentPost.value = {
      title: frontmatter.title || '',
      published: frontmatter.published || formatDate(new Date()),
      description: frontmatter.description || '',
      tags: frontmatter.tags || [],
      category: frontmatter.category || '',
      pinned: frontmatter.pinned || false,
      draft: frontmatter.draft || false,
      content: content,
      filename: post.name,
      sha: fileData.sha
    }

    // 标签转换为字符串
    tagsInput.value = Array.isArray(currentPost.value.tags)
      ? currentPost.value.tags.join(', ')
      : ''

    dialogMode.value = 'edit'
    showDialog.value = true
  } catch (err) {
    error.value = `加载文章失败: ${err.message}`
    console.error('加载文章失败:', err)
  } finally {
    loading.value = false
  }
}

// 保存文章
const savePost = async () => {
  // 解析标签
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)

  // 构建 frontmatter
  const frontmatter = {
    title: currentPost.value.title,
    published: currentPost.value.published,
    pinned: currentPost.value.pinned,
    description: currentPost.value.description,
    tags: tags,
    category: currentPost.value.category,
    draft: currentPost.value.draft
  }

  // 验证 frontmatter
  const validation = validateFrontmatter(frontmatter)
  if (!validation.valid) {
    error.value = validation.errors.join('\n')
    return
  }

  // 生成 Markdown 内容
  const markdown = generateMarkdown(frontmatter, currentPost.value.content)

  saving.value = true
  error.value = null

  try {
    if (dialogMode.value === 'create') {
      // 创建新文章
      const filename = previewFilename.value
      await blogAPI.createBlogPost(filename, markdown)
      alert(`✅ 文章创建成功！\n文件名：${filename}`)
    } else {
      // 更新现有文章
      await blogAPI.updateBlogPost(
        currentPost.value.filename,
        markdown
      )
      alert('✅ 文章更新成功！')
    }

    closeDialog()
    await loadPosts()
  } catch (err) {
    error.value = `保存失败: ${err.message}`
    console.error('保存文章失败:', err)
  } finally {
    saving.value = false
  }
}

// 确认删除
const confirmDelete = (post) => {
  postToDelete.value = post
  showDeleteDialog.value = true
}

// 删除文章
const deletePost = async () => {
  if (!postToDelete.value) return

  deleting.value = true
  error.value = null

  try {
    await blogAPI.deleteBlogPost(postToDelete.value.name)
    alert('✅ 文章删除成功！')
    showDeleteDialog.value = false
    postToDelete.value = null
    await loadPosts()
  } catch (err) {
    error.value = `删除失败: ${err.message}`
    console.error('删除文章失败:', err)
  } finally {
    deleting.value = false
  }
}

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false
  currentPost.value = {
    title: '',
    published: formatDate(new Date()),
    description: '',
    tags: [],
    category: '',
    pinned: false,
    draft: false,
    content: '',
    filename: '',
    sha: ''
  }
  tagsInput.value = ''
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 组件挂载时加载文章列表
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.blog-post-manager {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 16px;
}

.posts-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8f9fa;
}

th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
}

tbody tr:hover {
  background: #f8f9fa;
}

.actions {
  display: flex;
  gap: 8px;
}

.post-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin-bottom: 15px;
  color: #495057;
  font-size: 16px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.markdown-editor {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  resize: vertical;
}

.filename-preview {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
}

.filename-preview code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 10px;
}
</style>
