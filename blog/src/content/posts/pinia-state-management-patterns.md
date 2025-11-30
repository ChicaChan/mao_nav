---
title: Pinia 状态管理最佳实践
published: 2024-01-08
pinned: true
description: 探索 Pinia 状态管理的最佳实践模式，包括模块化设计、异步处理、持久化等高级用法。
tags: [Pinia, 状态管理, Vue, 最佳实践]
category: 前端开发
draft: false
---

Pinia 作为 Vue 的官方状态管理库，提供了简洁而强大的状态管理解决方案。

## 1. Store 设计模式

### 模块化设计

```javascript
// stores/user.js
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  // Actions
  const login = async (credentials) => {
    const response = await api.login(credentials)
    user.value = response.data
  }

  const logout = () => {
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    login,
    logout
  }
})
```

### 组合式 Store

```javascript
// stores/index.js
export const useAppStore = defineStore('app', () => {
  const userStore = useUserStore()
  const themeStore = useThemeStore()

  const isReady = computed(() =>
    userStore.isInitialized && themeStore.isInitialized
  )

  return {
    isReady,
    userStore,
    themeStore
  }
})
```

## 2. 异步处理模式

### 统一的错误处理

```javascript
const useAsyncState = (asyncFn) => {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const execute = async (...args) => {
    loading.value = true
    error.value = null

    try {
      data.value = await asyncFn(...args)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute
  }
}
```

通过这些模式，我们可以构建出更加健壮和可维护的状态管理系统！
