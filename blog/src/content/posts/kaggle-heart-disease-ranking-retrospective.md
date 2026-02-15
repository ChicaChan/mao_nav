---
title: Kaggle 心脏病预测竞赛复盘：从基线到 Public Rank 290（Top 11.1%）的工程化冲榜方法
published: 2026-02-15
pinned: true
description: 一篇面向初学者的技术复盘：按版本拆解 PS-S6E2 从基线到 Public Rank 290 的完整链路，包含验证体系、特征工程、候选融合、相关性约束、提交策略和失效分析。
tags: [Kaggle, 竞赛复盘, AUC, 特征工程, 模型融合, 工程化]
category: 数据科学
draft: false
---

## 📌 结果先看：为什么标题写排名，不写分数

这次比赛是 Kaggle `playground-series-s6e2`（Predicting Heart Disease，二分类 AUC）。

截至 **2026-02-15**（榜单导出时间 `2026-02-15T04:09:38`）：

- 总队伍：`2621`
- Top 10% 阈值：`Rank 263`
- 当前队伍：`Rank 290`
- 当前分数：`0.95385`
- 当前所处分位：`290 / 2621 = Top 11.1%`

写排名的价值在于：它直接反映你在比赛中的相对位置。  
同样是 `+0.00001`，在低分段和高分段的含金量完全不同。

---

## 🎯 本文目标与读者定位

这篇文章面向 Kaggle 初学者，目标不是“讲一个神奇参数”，而是讲清楚一套可复用流程：

1. 如何搭建 **可迭代** 的训练-验证-提交系统
2. 如何判断一个方案是“真增益”还是“CV 幻觉”
3. 如何在接近 Top10% 的窄边际区间继续推进

本文所有结论来自本项目实际版本迭代与提交记录，不是理论拼盘。

---

## 🧱 项目约束：为什么我选择“只云端训练”

本项目从中后期开始执行固定约束：

- **本地不运行训练代码**
- 训练全部在 Kaggle Kernel 进行
- 本地只做：
  - submission 文件校验
  - 候选筛选与相关性计算
  - 提交策略执行与复盘

这个约束的好处是：

1. 训练环境一致，减少“本地和线上不一致”的干扰
2. 资源成本更低，普通设备可持续参赛
3. 流程更容易标准化和自动化

---

## 📈 版本时间线：哪些动作真正带来了排名提升

| 时间 | 版本/动作 | Public 分数 | 阶段结论 |
|---|---|---:|---|
| 2026-02-09 | 初始可提交版本 | 0.95327 | 先打通提交流程 |
| 2026-02-09 | baseline 优化 | 0.95332 | 小幅提升，方向正确 |
| 2026-02-10 | aggressive 重建 | 0.95340 | 进入稳定基线区 |
| 2026-02-11 | v13：target stats + robust quantile | 0.95374 | 首次大幅跃迁（+0.00034） |
| 2026-02-13 | v17：external mix（q0p5） | 0.95376 | 外部信息开始生效 |
| 2026-02-13 | v17：external mix（q0p25） | 0.95385 | 历史最佳 |
| 2026-02-15 | v19：global rank-meta / hill-climb | 0.95374 | CV 更高但线上不兑现 |

从冲榜角度看，最关键转折不是“融合器越来越复杂”，而是两件事：

- v13：**防泄漏目标统计 + 稳健候选构造**
- v17：**引入异源外部候选**

---

## 🧠 技术主线拆解（含细节）

## 1) 训练骨架：多基模型 + OOF 驱动

核心训练脚本：`kaggle_kernel/ps_s6e2_gpu/train_gpu_catboost.py`

主干模型：

- LightGBM
- CatBoost（GPU）
- XGBoost

训练输出不是单一 submission，而是一组标准产物：

1. `submission_*.csv`（候选提交文件）
2. `candidate_scores_cloud.csv`（候选 CV 排名）
3. `metrics_rank_push_cloud.json`（参数、轨迹、模型指标）

这样做的意义：  
后续融合、筛选、分析都能复用同一批 OOF / test 预测，避免重复训练。

---

## 2) 特征工程：Cross-Fit Target Statistics（核心增益来源之一）

中后期提升的关键不是“再堆一个模型”，而是把 target stats 做干净。

### 为什么 target stats 容易翻车？

如果你直接用全量训练集统计：

- `E[y | category]`
- `freq(category)`

然后回填到训练集，会造成标签穿越（leakage），CV 会明显虚高。

### 本项目做法（Cross-Fit）

设 K 折：

1. 对每个 fold 的验证子集，只使用“其余 K-1 折”计算目标统计
2. 验证子集映射该统计值
3. 测试集使用全训练统计映射

此外还做了两件补充：

- 对高基数数值特征先分箱再统计（`target_stats_bin_count=12`）
- 构造少量统计交叉特征（`target_stats_interactions=3/4/6` 网格）

在 v19 指标里，`ts_i4` profile 的表现最好：

- `feature_count=43`
- `target_stats_features=30`
- `best_candidate_cv=0.9555907251`

---

## 3) 候选构造：不要只看“最高 CV”，要看“信息差异”

项目里有几类候选：

- 基础融合：`safe` / `tuned` / `aggressive`
- 稳健候选：`robust_q*`（按分位融合）
- 全局候选：`global_robust_q*`
- 二层候选：`rank_meta_*`、`hill_internal_*`、`global_rank_meta_topk`、`global_hill_topk`

其中常用融合形式：

### (a) 加权均值

\[
\hat{p} = \sum_i w_i p_i,\quad \sum_i w_i = 1,\ w_i \ge 0
\]

### (b) Rank 融合

先把每个候选预测转为秩，再做加权。

优势：缓解不同模型概率标尺不一致的问题。

### (c) Quantile 融合

对同一样本在多候选上的预测取分位数（如 `q=0.25`）。

优势：对离群候选更稳健，尤其在候选池质量参差时。

---

## 4) 相关性约束：中后期比“再加候选”更重要

项目里长期使用相关性门槛：

- `corr_prune_threshold` 网格：`0.9986 / 0.9988 / 0.9990`
- 候选挑选门槛：`candidate_max_corr=0.9985`

为什么这一步很关键？

因为在后期，很多候选只是在同一信号上做小扰动，相关性接近 1。  
这类候选即使 CV 接近，也几乎不给线上新增信息。

---

## 5) 二层候选：rank-meta 与 hill-climb 的收益边界

v19 新引入了全局 top-k 二层候选，离线结果确实更高：

- `global_rank_meta_topk`: `0.9555923799`
- `global_hill_topk`: `0.9555987729`（该轮最高 CV）

但线上两者都停在 `0.95374`。  
说明二层方法并非无效，而是受限于候选池的有效多样性。

一句话：  
**当输入候选不够“正交”时，再聪明的二层融合器也很难创造真实泛化增益。**

---

## 🧪 验证体系：如何减少“CV 看起来涨，线上不涨”

我在这轮比赛最终沉淀了 3 条验证原则：

### 原则 1：OOF 优先，单次 holdout 只做补充

OOF 是二层和误差分析的唯一可信输入。  
训练集拟合值不能替代 OOF。

### 原则 2：把“增益”拆成两个指标

不是只看 `cv_auc`，而是同时看：

1. 对基线候选的 `cv_gain`
2. 与锚点候选的相关性 `corr_to_anchor`

只有“有增益 + 低相关”同时成立，才值得提交。

### 原则 3：限制 daily 提交为 2 份

标准策略：

- 主攻：当前高潜候选
- 防守：低相关稳健候选

连续提交多个同质候选，信息价值很低。

---

## 🚀 实战工作流（可直接复用）

以下流程适合“本地弱算力 + 云端训练”场景。

### Step 1：推送云端训练

```powershell
kaggle kernels push -p kaggle_kernel/ps_s6e2_gpu
```

### Step 2：轮询训练状态

```powershell
kaggle kernels status <your_kaggle_username>/<your_kernel_slug>
```

### Step 3：拉取云端产物

```powershell
kaggle kernels output <your_kaggle_username>/<your_kernel_slug> -p kaggle_outputs/cloud_latest
```

### Step 4：本地候选筛选（含相关性门槛）

```powershell
python src/online_sprint.py pick-daily `
  --candidate-scores-path kaggle_outputs/cloud_latest/candidate_scores_cloud.csv `
  --submission-dir kaggle_outputs/cloud_latest `
  --top-k 2 `
  --max-correlation 0.998 `
  --output-path kaggle_outputs/cloud_latest/daily_pick.json
```

### Step 5：人工提交并回填结果

提交后在进度文档里回填：

- 提交文件名
- 提交时间
- Public 分数
- 相对锚点增减

这一步决定你是否能形成长期可用的实验资产。

---

## 🧯 为什么借鉴了高分代码，仍然经常不上分

这是最常见误区，给出工程化答案：

## 1) 你借到的是“形式”，不是“新增信号”

高分方案中的某个融合器/参数，只有在其原始候选池结构下才有效。  
直接迁移到你的候选池，可能没有同样的信息增量。

## 2) 高分方案可能依赖特定验证条件

例如特征筛选方式、fold 切分、外部文件来源差异。  
这些条件不一致时，CV 提升可能是局部现象。

## 3) 你在高分区间里，噪声门槛很高

当你已经在 Top 11% 左右，继续提升需要更“硬”的证据：

- 更稳定的跨版本回报
- 更低相关的候选组合
- 更少但更高价值的提交

---

## 📚 给初学者的“干货清单”

## A. 每次实验都要落盘 5 个文件

1. 候选分数表（`candidate_scores_cloud.csv`）
2. 参数与轨迹（`metrics_rank_push_cloud.json`）
3. 每个候选的 submission 文件
4. 当日筛选结果（`daily_pick*.json`）
5. 提交回报记录（自建 csv/md）

没有这些文件，你做不到严肃复盘。

## B. 每次提交前自检 6 项

1. 列名与 sample submission 一致
2. id 顺序一致
3. 预测值在 `[0, 1]`
4. 候选与锚点相关性是否过高
5. 本轮提交是否与上一轮高度同质
6. 提交备注是否可追踪版本

## C. 候选入选规则（建议）

可定义一个简单 gate：

\[
score = \Delta cv - \lambda \cdot \max(0, corr - c_0)
\]

其中：

- \(\Delta cv\)：相对锚点的 OOF 增益
- \(corr\)：与锚点相关性
- \(c_0\)：相关性容忍阈值（如 0.998）
- \(\lambda\)：惩罚系数

分数不达标就不提交，强制减少“情绪化提交”。

---

## 🗺 下一阶段（v20+）如何继续推进

基于当前状态（Public Rank 290），下一阶段建议：

1. 固定 `external_mix_q0p25` 为锚点
2. 小步扰动 quantile / corr / source 配额，不做大改
3. 强制执行“主攻 + 防守”双提交纪律
4. 候选池优先引入异源信号，而非同源微调

目标不是追求“更复杂的模型名词”，而是提高“每次提交的期望信息增量”。

---

## 结论

这轮比赛最有价值的沉淀，不是某个单点参数，而是一套能迁移的竞赛工程方法：

- 版本化迭代
- OOF 驱动验证
- 相关性约束筛选
- 云端训练 + 本地编排
- 提交结果可追踪复盘

对初学者来说，真正的进阶不是“偶然冲高一次”，而是可以稳定重复这条路径。
