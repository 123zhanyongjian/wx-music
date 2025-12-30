# getApp() 问题修复说明

## 📋 问题描述

在小程序中，`getApp()` 不能在模块顶层直接调用，因为此时 app 实例可能还没有初始化。这会导致 `getApp()` 返回 `undefined` 或抛出错误。

## 🔍 问题原因

在模块加载时（`require` 时），app 实例可能还没有创建，因此无法获取。`getApp()` 只能在以下场景中使用：

1. ✅ 在页面或组件的生命周期函数中
2. ✅ 在事件处理函数中
3. ✅ 在异步回调函数中
4. ❌ **不能在模块顶层直接调用**

## ✅ 修复方案

### 方案：延迟获取 app 实例

创建一个安全的获取 app 实例的函数，在需要时才调用：

```javascript
/**
 * 获取 app 实例
 * @returns {Object|null}
 */
function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    return null;
  }
}
```

### 修复的文件

#### 1. utils/request.js ✅
- **问题**: 模块顶层使用 `const app = getApp()`
- **修复**: 移除顶层调用，在需要时通过 `getAppInstance()` 获取

#### 2. utils/auth.js ✅
- **问题**: 模块顶层使用 `const app = getApp()`
- **修复**: 创建 `getApp()` 和 `getHost()` 方法，延迟获取

#### 3. utils/api.js ✅
- **问题**: 模块顶层使用 `const app = getApp()`
- **修复**: 创建 `getAppInstance()` 函数，在需要时调用

#### 4. utils/util.js ✅
- **问题**: 模块顶层使用 `const apiHost = getApp().host`
- **修复**: 创建 `getApiHost()` 函数，延迟获取

#### 5. utils/time.js ✅
- **问题**: 模块顶层使用 `const appInst = getApp()`
- **修复**: 创建 `getAppInstance()` 函数，在所有使用 `appInst` 的地方添加空值检查

## 📝 修复示例

### 修复前 ❌

```javascript
// utils/auth.js
const app = getApp(); // ❌ 模块顶层调用

class AuthService {
  async getUserInfo(userId) {
    // ...
    userInfo.avatarUrl = `${app.host}/${userInfo.headimg}`; // ❌ app 可能为 undefined
  }
}
```

### 修复后 ✅

```javascript
// utils/auth.js
class AuthService {
  /**
   * 获取 app 实例
   */
  getApp() {
    try {
      return getApp();
    } catch (e) {
      return null;
    }
  }

  /**
   * 获取 host
   */
  getHost() {
    const app = this.getApp();
    return app?.host || '';
  }

  async getUserInfo(userId) {
    // ...
    const host = this.getHost(); // ✅ 延迟获取
    userInfo.avatarUrl = `${host}/${userInfo.headimg}`;
  }
}
```

## ⚠️ 注意事项

1. **空值检查**: 使用 `getAppInstance()` 后，需要检查返回值是否为 `null`
2. **可选链操作符**: 使用 `?.` 安全访问属性
3. **默认值**: 提供合理的默认值，避免程序崩溃

## 🎯 最佳实践

### ✅ 推荐做法

```javascript
// 在函数内部获取
function someFunction() {
  const app = getAppInstance();
  if (app && app.host) {
    // 使用 app.host
  }
}

// 或使用可选链
function someFunction() {
  const app = getAppInstance();
  const host = app?.host || '';
}
```

### ❌ 不推荐做法

```javascript
// 模块顶层获取
const app = getApp(); // ❌ 可能获取不到

// 直接使用，不检查
function someFunction() {
  const host = app.host; // ❌ app 可能为 undefined
}
```

## 📊 修复统计

- ✅ 修复文件数: 5 个
- ✅ 添加安全函数: 5 个
- ✅ 添加空值检查: 30+ 处

## 🔄 后续建议

1. **代码审查**: 检查其他文件是否也有类似问题
2. **统一规范**: 所有工具类统一使用 `getAppInstance()` 模式
3. **文档更新**: 更新开发规范，避免类似问题

---

**修复完成时间**: 2025-01-XX
**文档版本**: v1.0

