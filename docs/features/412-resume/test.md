# 测试计划

## 本轮执行集

- 当前基线：BL-001
- 变更基线：`4d7792809d6d0684f768a0e71716441bf20a3a5d`
- 生产 diff：仅 `lib/core/searcher.js` 的412等待重试。
- 直接目标：G-001 / R-001 / T-001。
- 生产符号：`Searcher.checkAllDynamic`。
- 搜索词：`checkAllDynamic`, `getOneDynamicInfoByUID`, `412`。
- 现有测试命中：无；新增无网络定向行为测试。
- 本轮用例：AT-001、AT-002、AT-003。
- 排除：现有 `api`、`dynamic_card` 等联网测试与本次重试状态无直接契约关系。
- 执行模式：定向。
- 全量触发条件：不适用；未修改测试框架或广泛公共契约。

| ID | 对应目标与需求 | 场景 | 验证方式 | 预期结果 |
| --- | --- | --- | --- | --- |
| AT-001 | G-001 / R-001 | 首次412，随后成功 | Node定向测试，mock请求与delay | 相同offset请求2次，delay一次且为7200000ms |
| AT-002 | G-001 / R-001 | 正常响应 | Node定向测试 | 请求1次，不调用2小时delay |
| AT-003 | G-001 / R-001 | 非412错误及相似数值 `-412.5` | Node定向测试 | 不调用2小时delay，保持现有null返回 |

## 执行证据

- RED：容器旧代码执行 `node test/searcher_412_resume.test.js`，只请求一次即返回 `null`，相同 offset 两次调用断言失败（`artifact://74`）。
- GREEN：本地执行 `node test/searcher_412_resume.check.js`，AT-001/002/003 全部通过并输出 `searcher_412_resume.test ... ok!`。
- 静态：`npx eslint lib/core/searcher.js test/searcher_412_resume.check.js`、两个文件 `node --check`、`git diff --check` 均通过。
