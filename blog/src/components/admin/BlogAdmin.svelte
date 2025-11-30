<script>
  import { onMount } from 'svelte'
  import {
    parseFrontmatter,
    generateMarkdown,
    generateSlug,
    validateFrontmatter,
    formatDate
  } from '../../utils/markdownParser'
  import {
    healthCheck,
    listBlogPosts,
    getBlogPost,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost
  } from '../../utils/blogAPI'

  // 状态
  let posts = []
  let loading = false
  let error = null
  let showDialog = false
  let showDeleteDialog = false
  let dialogMode = 'create' // 'create' | 'edit'
  let saving = false
  let deleting = false
  let postToDelete = null

  // 当前编辑的文章
  let currentPost = {
    title: '',
    published: formatDate(new Date()),
    description: '',
    tags: [],
    category: '',
    pinned: false,
    draft: false,
    content: '',
    filename: ''
  }

  // 标签输入（用逗号分隔的字符串）
  let tagsInput = ''

  // 预览文件名
  $: previewFilename = (() => {
    if (dialogMode === 'edit') {
      return currentPost.filename
    }
    if (!currentPost.title) {
      return 'untitled.md'
    }
    const slug = generateSlug(currentPost.title)
    return `${slug}.md`
  })()

  // 加载文章列表
  async function loadPosts() {
    loading = true
    error = null

    try {
      // 先检查后端服务是否运行
      await healthCheck()
      posts = await listBlogPosts()
    } catch (err) {
      error = err.message
      console.error('加载文章列表失败:', err)
    } finally {
      loading = false
    }
  }

  // 显示创建对话框
  function showCreateDialog() {
    dialogMode = 'create'
    currentPost = {
      title: '',
      published: formatDate(new Date()),
      description: '',
      tags: [],
      category: '前端开发',
      pinned: false,
      draft: false,
      content: '',
      filename: ''
    }
    tagsInput = ''
    showDialog = true
  }

  // 编辑文章
  async function editPost(post) {
    loading = true
    error = null

    try {
      // 获取文章内容
      const fileData = await getBlogPost(post.name)
      const { frontmatter, content } = parseFrontmatter(fileData.content)

      // 填充表单
      currentPost = {
        title: frontmatter.title || '',
        published: frontmatter.published || formatDate(new Date()),
        description: frontmatter.description || '',
        tags: frontmatter.tags || [],
        category: frontmatter.category || '',
        pinned: frontmatter.pinned || false,
        draft: frontmatter.draft || false,
        content: content,
        filename: post.name
      }

      // 标签转换为字符串
      tagsInput = Array.isArray(currentPost.tags)
        ? currentPost.tags.join(', ')
        : ''

      dialogMode = 'edit'
      showDialog = true
    } catch (err) {
      error = `加载文章失败: ${err.message}`
      console.error('加载文章失败:', err)
    } finally {
      loading = false
    }
  }

  // 保存文章
  async function savePost() {
    // 解析标签
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag)

    // 构建 frontmatter
    const frontmatter = {
      title: currentPost.title,
      published: currentPost.published,
      pinned: currentPost.pinned,
      description: currentPost.description,
      tags: tags,
      category: currentPost.category,
      draft: currentPost.draft
    }

    // 验证 frontmatter
    const validation = validateFrontmatter(frontmatter)
    if (!validation.valid) {
      error = validation.errors.join('\n')
      return
    }

    // 生成 Markdown 内容
    const markdown = generateMarkdown(frontmatter, currentPost.content)

    saving = true
    error = null

    try {
      if (dialogMode === 'create') {
        // 创建新文章
        const filename = previewFilename
        await createBlogPost(filename, markdown)
        alert(`✅ 文章创建成功！\n文件名：${filename}`)
      } else {
        // 更新现有文章
        await updateBlogPost(currentPost.filename, markdown)
        alert('✅ 文章更新成功！')
      }

      closeDialog()
      await loadPosts()
    } catch (err) {
      error = `保存失败: ${err.message}`
      console.error('保存文章失败:', err)
    } finally {
      saving = false
    }
  }

  // 确认删除
  function confirmDelete(post) {
    postToDelete = post
    showDeleteDialog = true
  }

  // 删除文章
  async function deletePost() {
    if (!postToDelete) return

    deleting = true
    error = null

    try {
      await deleteBlogPost(postToDelete.name)
      alert('✅ 文章删除成功！')
      showDeleteDialog = false
      postToDelete = null
      await loadPosts()
    } catch (err) {
      error = `删除失败: ${err.message}`
      console.error('删除文章失败:', err)
    } finally {
      deleting = false
    }
  }

  // 关闭对话框
  function closeDialog() {
    showDialog = false
    currentPost = {
      title: '',
      published: formatDate(new Date()),
      description: '',
      tags: [],
      category: '',
      pinned: false,
      draft: false,
      content: '',
      filename: ''
    }
    tagsInput = ''
  }

  // 格式化文件大小
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 组件挂载时加载文章列表
  onMount(() => {
    loadPosts()
  })
</script>

<div class="blog-admin">
  <!-- 顶部标题栏 -->
  <header class="admin-header">
    <h1>📝 博客管理后台</h1>
    <div class="header-actions">
      <button on:click={loadPosts} class="btn btn-secondary" disabled={loading}>
        {loading ? '加载中...' : '🔄 刷新列表'}
      </button>
      <button on:click={showCreateDialog} class="btn btn-primary">
        ➕ 创建新文章
      </button>
    </div>
  </header>

  <!-- 加载状态 -->
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>正在加载文章列表...</p>
    </div>
  {/if}

  <!-- 错误提示 -->
  {#if error}
    <div class="error-banner">
      <p>❌ {error}</p>
      <button on:click={loadPosts} class="btn btn-secondary">重试</button>
    </div>
  {/if}

  <!-- 文章列表 -->
  {#if !loading && !error}
    <div class="posts-container">
      {#if posts.length === 0}
        <div class="empty-state">
          <p>📝 还没有文章，点击"创建新文章"开始写作吧！</p>
        </div>
      {:else}
        <div class="posts-grid">
          {#each posts as post (post.name)}
            <div class="post-card">
              <div class="post-info">
                <h3>{post.name}</h3>
                <p class="post-size">{formatSize(post.size)}</p>
              </div>
              <div class="post-actions">
                <button on:click={() => editPost(post)} class="btn btn-sm btn-edit">
                  ✏️ 编辑
                </button>
                <button on:click={() => confirmDelete(post)} class="btn btn-sm btn-delete">
                  🗑️ 删除
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- 创建/编辑对话框 -->
  {#if showDialog}
    <div class="dialog-overlay" on:click|self={closeDialog}>
      <div class="dialog-container">
        <div class="dialog-header">
          <h2>{dialogMode === 'create' ? '创建新文章' : '编辑文章'}</h2>
          <button on:click={closeDialog} class="close-btn">✕</button>
        </div>

        <div class="dialog-body">
          <!-- Frontmatter 表单 -->
          <section class="form-section">
            <h3>📋 文章信息</h3>

            <div class="form-group">
              <label>标题 *</label>
              <input
                bind:value={currentPost.title}
                type="text"
                placeholder="请输入文章标题"
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>发布日期 *</label>
                <input
                  bind:value={currentPost.published}
                  type="date"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>分类 *</label>
                <input
                  bind:value={currentPost.category}
                  type="text"
                  placeholder="例如：前端开发"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label>描述 *</label>
              <textarea
                bind:value={currentPost.description}
                placeholder="请输入文章描述"
                class="form-input"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>标签（用逗号分隔）</label>
              <input
                bind:value={tagsInput}
                type="text"
                placeholder="例如：Vue, JavaScript, 教程"
                class="form-input"
              />
            </div>

            <div class="form-row">
              <div class="form-group checkbox-group">
                <label>
                  <input bind:checked={currentPost.pinned} type="checkbox" />
                  📌 置顶文章
                </label>
              </div>

              <div class="form-group checkbox-group">
                <label>
                  <input bind:checked={currentPost.draft} type="checkbox" />
                  📝 草稿状态
                </label>
              </div>
            </div>
          </section>

          <!-- Markdown 编辑器 -->
          <section class="form-section">
            <h3>✍️ 文章内容（Markdown）</h3>
            <textarea
              bind:value={currentPost.content}
              placeholder="请输入 Markdown 格式的文章内容..."
              class="form-input markdown-editor"
              rows="15"
            ></textarea>
          </section>

          <!-- 文件名预览 -->
          <section class="form-section">
            <p class="filename-preview">
              📄 文件名：<code>{previewFilename}</code>
            </p>
          </section>
        </div>

        <div class="dialog-footer">
          <button on:click={closeDialog} class="btn btn-secondary">取消</button>
          <button on:click={savePost} class="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : (dialogMode === 'create' ? '创建' : '保存')}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- 删除确认对话框 -->
  {#if showDeleteDialog}
    <div class="dialog-overlay" on:click|self={() => showDeleteDialog = false}>
      <div class="dialog-container dialog-small">
        <div class="dialog-header">
          <h2>确认删除</h2>
          <button on:click={() => showDeleteDialog = false} class="close-btn">✕</button>
        </div>

        <div class="dialog-body">
          <p>确定要删除文章 <strong>{postToDelete?.name}</strong> 吗？</p>
          <p class="warning-text">⚠️ 此操作不可恢复！</p>
        </div>

        <div class="dialog-footer">
          <button on:click={() => showDeleteDialog = false} class="btn btn-secondary">取消</button>
          <button on:click={deletePost} class="btn btn-danger" disabled={deleting}>
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
.blog-admin {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.admin-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header h1 {
  margin: 0;
  font-size: 28px;
  color: #1a202c;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
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

.btn-edit {
  background: #667eea;
  color: white;
}

.btn-edit:hover {
  background: #5568d3;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
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

.error-banner {
  background: #f8d7da;
  color: #721c24;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #6c757d;
  font-size: 18px;
}

.posts-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.post-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.post-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #1a202c;
  word-break: break-word;
}

.post-size {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #6c757d;
}

.post-actions {
  display: flex;
  gap: 8px;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.dialog-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.dialog-small {
  max-width: 500px;
}

.dialog-header {
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1a202c;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #1a202c;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 18px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  min-height: 300px;
}

.filename-preview {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  margin: 0;
}

.filename-preview code {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .dialog-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
