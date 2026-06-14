# 私人导师APP - 使用指南

## 📱 项目简介

**私人导师** 是一款为陕西省榆林市八年级学生定制的学习管理应用，核心功能包括：

- ✅ 学习计划管理
- ✅ 作息时间规范
- ✅ 娱乐时间控制
- ✅ 夸克网盘课程播放
- ✅ 诊断测试系统
- ✅ 赏罚激励机制

---

## 🚀 快速开始

### 第一步：安装开发环境

#### 1. 安装Node.js

访问 https://nodejs.org/ 下载并安装Node.js 18或更高版本。

安装完成后，打开终端验证：
```bash
node --version
npm --version
```

#### 2. 安装Expo CLI

```bash
npm install -g expo-cli eas-cli
```

#### 3. 创建Expo账号

访问 https://expo.dev/ 注册账号。

然后在终端登录：
```bash
expo login
eas login
```

---

### 第二步：配置项目

#### 1. 进入项目目录

```bash
cd zhongkao-mentor
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置夸克网盘Cookie

打开 `src/config/index.js`，找到 `QUARK_CONFIG` 部分：

```javascript
export const QUARK_CONFIG = {
  cookie: '',  // <-- 在这里填入您的Cookie
  // ...
};
```

**获取Cookie的方法：**

1. 打开浏览器（Chrome/Edge）
2. 访问 https://pan.quark.cn
3. 登录您的夸克账号
4. 按 `F12` 打开开发者工具
5. 切换到 `Network`（网络）标签
6. 刷新页面（F5）
7. 点击任意请求
8. 在 `Headers` 中找到 `Cookie`
9. 复制完整的Cookie值
10. 粘贴到配置文件中

**Cookie示例格式：**
```
__puus=xxxxxx; __pus=xxxxxx; _qk_bx_ck_v1=xxxxxx; tfstk=xxxxxx
```

---

### 第三步：运行项目

#### 1. 启动开发服务器

```bash
npm start
# 或者
expo start
```

#### 2. 在iPhone上运行

**方式一：使用Expo Go（推荐测试）**

1. 在App Store下载 `Expo Go` 应用
2. 确保iPhone和电脑在同一WiFi网络
3. 用iPhone扫描终端中的二维码
4. 应用会自动加载

**方式二：构建原生应用（推荐正式使用）**

```bash
# 构建预览版IPA
eas build --platform ios --profile preview
```

构建完成后，会提供一个下载链接。下载IPA文件后，使用以下方式安装：

- **AltStore**（推荐）：https://altstore.io
- **Sideloadly**：https://sideloadly.io

---

### 第四步：打包IPA

#### 1. 配置Apple开发者账号

在 `eas.json` 中添加您的Apple开发者信息：

```json
{
  "build": {
    "preview": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

#### 2. 执行打包

```bash
# 预览版（用于测试）
eas build --platform ios --profile preview

# 正式版
eas build --platform ios --profile production
```

#### 3. 安装IPA

打包完成后：

1. 下载IPA文件
2. 使用AltStore或Sideloadly安装
3. 在iPhone上信任开发者证书：
   - 设置 → 通用 → VPN与设备管理 → 信任开发者

---

## 📂 项目结构

```
zhongkao-mentor/
├── App.js                    # 应用入口
├── app.json                  # Expo配置
├── eas.json                  # EAS Build配置
├── package.json              # 项目依赖
│
├── assets/                   # 静态资源
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
│
└── src/
    ├── config/
    │   └── index.js          # 应用配置
    │
    ├── context/
    │   └── AppContext.js     # 全局状态管理
    │
    ├── screens/
    │   ├── HomeScreen.js     # 主页
    │   ├── StudyPlanScreen.js  # 学习计划
    │   ├── CourseListScreen.js  # 课程列表
    │   ├── VideoPlayerScreen.js  # 视频播放
    │   ├── DiagnosisScreen.js  # 诊断测试
    │   ├── ScheduleScreen.js  # 作息时间
    │   └── SettingsScreen.js  # 设置
    │
    ├── components/           # 可复用组件（待开发）
    │
    ├── utils/                # 工具函数（待开发）
    │
    └── api/                  # API封装（待开发）
```

---

## ⚙️ 配置说明

### 1. 学生信息配置

在 `src/config/index.js` 中修改：

```javascript
export const STUDENT_CONFIG = {
  name: '学生姓名',  // <-- 修改为实际姓名
  grade: '八年级',
  school: '学校名称',  // <-- 修改为实际学校
  city: '榆林市',
  province: '陕西省',
};
```

### 2. 中考科目配置

根据榆林市实际政策调整：

```javascript
export const EXAM_SUBJECTS = {
  subjects: [
    { id: 'chinese', name: '语文', score: 120 },
    { id: 'math', name: '数学', score: 120 },
    // ... 其他科目
  ],
};
```

### 3. 学习时间配置

根据实际情况调整：

```javascript
export const STUDY_TIME_CONFIG = {
  dailySchedule: {
    weekday: {
      evening: {
        start: '19:00',
        end: '21:45',
        totalStudy: 150,  // 2.5小时
      },
    },
  },
};
```

### 4. 娱乐时间配置

```javascript
export const ENTERTAINMENT_CONFIG = {
  baseDuration: {
    weekday: 45,  // 上学日45分钟
    weekend: 90,  // 周末90分钟
  },
  types: {
    red: {
      items: [
        { id: 'douyin', name: '抖音/快手', maxDaily: 30 },
        { id: 'games', name: '游戏', maxDaily: 45 },
      ],
    },
  },
};
```

---

## 🎯 核心功能说明

### 1. 学习计划管理

- 根据诊断结果生成个性化学习计划
- 按科目和难度分配学习时间
- 支持动态调整（根据表现增加/减少时间）

### 2. 作息时间规范

- 标准作息时间表（上学日/周末/假期）
- 睡眠时间监控（23:00强制熄灯）
- 起床提醒（6:00叫醒）

### 3. 娱乐时间控制

- 每日娱乐时间配额（45-90分钟）
- 三级娱乐分类（绿色/黄色/红色）
- 超时自动锁定
- 奖惩机制（表现好+30分钟，表现差-30分钟）

### 4. 夸克网盘播放

- 自动解析课程目录
- 视频播放器（支持倍速）
- 播放进度记录
- Cookie过期提醒

### 5. 诊断测试系统

- 85道综合测试题
- 110分钟测试时长
- 自适应出题算法
- 详细诊断报告

---

## 🔧 常见问题

### Q1: 如何更新Cookie？

**A**: Cookie有效期约7天。过期后：
1. 重新获取Cookie（参考上方教程）
2. 打开应用 → 设置 → 粘贴新Cookie → 保存

### Q2: IPA安装后无法打开？

**A**: 需要信任开发者证书：
1. 设置 → 通用 → VPN与设备管理
2. 找到对应的开发者证书
3. 点击"信任"

### Q3: 如何修改学习时间？

**A**: 编辑 `src/config/index.js` 中的 `STUDY_TIME_CONFIG`

### Q4: 如何添加新的娱乐类型？

**A**: 编辑 `src/config/index.js` 中的 `ENTERTAINMENT_CONFIG`

### Q5: 视频播放失败？

**A**: 
1. 检查Cookie是否过期
2. 检查网络连接
3. 确认夸克网盘中有对应视频

---

## 📅 开发计划

### 阶段一：基础框架 ✅
- [x] 项目初始化
- [x] 基本UI框架
- [x] 配置系统
- [x] 本地存储

### 阶段二：核心功能 🚧
- [ ] 学习计划生成器
- [ ] 作息时间管理
- [ ] 娱乐时间计时器
- [ ] 诊断测试系统

### 阶段三：夸克整合 📋
- [ ] API封装
- [ ] 课程解析
- [ ] 视频播放器
- [ ] 进度记录

### 阶段四：管控功能 📋
- [ ] 应用监控
- [ ] 时长限制
- [ ] 强制锁定

### 阶段五：优化完善 📋
- [ ] 性能优化
- [ ] UI美化
- [ ] Bug修复

---

## 📞 技术支持

如遇到问题，请检查：

1. Node.js版本是否正确（18+）
2. Expo CLI是否安装
3. 依赖是否完整安装（`npm install`）
4. Cookie是否有效
5. 网络连接是否正常

---

## 📝 更新日志

### v1.0.0 (2026-06-12)
- ✅ 项目初始化
- ✅ 基本框架搭建
- ✅ 配置文件系统
- ✅ 主页界面
- ✅ 设置页面
- ✅ 夸克Cookie管理

---

## 🎓 设计理念

**科学育娃，精准提分**

- 📊 数据驱动：基于诊断结果制定个性化计划
- ⏰ 时间管理：严格控制学习和娱乐时间
- 🎮 劳逸结合：合理安排娱乐，避免过度疲劳
- 🏆 激励机制：赏罚分明，激发学习动力
- 📱 技术赋能：利用科技手段提升学习效率

---

**祝学习进步，中考成功！** 🎓
