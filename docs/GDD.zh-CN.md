# Raiden II Stage 1 可玩原型 GDD

## 1. 愿景与原型门槛
- 做一个桌面优先的 `1P Solo + Easy` Stage 1 竖切片：玩家能开始、能理解、能存活，并且能一路打到并击破 Stage 1 Boss。
- Sprint 2 的 replacement asset 版本只视为功能基线，不视为质量完成的 demo。
- Sprint 3 只有在 Stage 1 像一个小型可玩街机任务，而不是系统测试页面时，才算成功。
- 在这个 boss-clear 闭环足够可信之前，不扩展 Stage 2-8 打磨、公开发布包装或 2P 展示级调参。

## 2. 玩家体验目标
- 进入游戏后 30 秒内，玩家应该不看外部说明也能理解移动、射击、闪避、拾取物和核心 HUD。
- Easy 正常主动游玩路径下，玩家应在约 2-3 分钟内抵达 Stage 1 Boss。
- 关卡路线应该在压力与恢复之间交替，让玩家有理由射击、移动、收集并重新调整站位。
- Boss clear 后必须有明确完成反馈，再进入下一关、loop 或重玩相关流程。

## 3. 操作与新手引导
- 1P 主操作为：`Arrow Keys` 移动，`Z` 射击，`X` 炸弹，`Right Shift` 慢速移动。
- 标题/选择流程必须在进入任务前展示这些按键绑定；gameplay HUD 中也要保留简洁提示或可访问入口。
- 开场 10-15 秒应该用低威胁目标教学射击，让玩家能明显看到持续按 `Z` 会产生效果。
- 第一次炸弹提示只做信息引导；Sprint 3 easy-path 验收不应要求玩家必须用炸弹才能存活。
- 2P 控制继续保持回归可用，但不是 Sprint 3 新手引导重点。

## 4. Stage 1 结构
- Stage 1 重构为五个可读段落：开场教学压力、中段侧翼压力、恢复/奖励缓存、Boss 前升级压力、Boss 入场。
- 开场教学压力用低密度 scout 和慢速敌弹教学射击与横向移动。
- 中段侧翼压力引入侧翼入场、地面/炮台威胁和路线纪律，但不能淹没整个 playfield。
- 恢复/奖励缓存段提供清晰的武器或分数奖励、checkpoint-safe 的喘息点，以及一个可选 hidden route。
- Boss 前升级压力短时间提高敌人密度和弹幕压力，然后干净收束到 Boss 警告。
- Boss 入场需要清空路线、提示 encounter，并给玩家一个稳定窗口来理解 Death Walkers。

## 5. 战斗可读性
- 玩家子弹、敌方子弹、拾取物、命中闪光、爆炸和 Boss 部件在运动中也必须可区分。
- 敌弹在成为致命威胁前应先具备可读性；早期 pattern 教学路线与闪避节奏，Boss pattern 再进行考核。
- 玩家受击反馈应该在 continue/respawn 流程接管前短暂展示“发生了什么”。
- 原型阶段拾取物表现优先保证可见性和持续性，不追求街机原作级微妙度。
- HUD 优先级为分数、生命、炸弹、当前武器、关卡/loop，以及仅在 Boss 激活时显示 Boss 血量。

## 6. 敌人与波次设计
- 开场波次使用 scout 和简单地面目标，让 `Z` 射击马上变得有用。
- 中段波次加入侧翼 warplane 和炮台，把玩家从单一纵向安全线里推出来。
- Item carrier 应奖励主动射击，并出现在压力峰值之前，而不是玩家已经被压垮之后。
- Boss 前波次应制造短暂升级压力，然后干净停止，避免 Boss 入场像误刷怪。
- 波次时序优先走 authored data；避免在 simulation 里写 `stage-1` 专用特判。

## 7. Boss 设计
- Death Walkers 必须有多个可读阶段，并使用 deterministic 但有变化的攻击模式。
- 必需 pattern 成分包括：瞄准玩家的射击、横向封锁、散布变化，以及短暂重定位/恢复窗口。
- 当前永久安定点不能作为 Sprint 3 可接受状态；玩家停在单一位置时，Boss pattern 必须最终覆盖它。
- 所有看起来像随机的变化都必须使用 seeded 或 deterministic 方式实现，保证测试、回放和调试可复现。
- Easy 下 Boss 应该通过主动移动可闪避，而不是靠记住一个像素级安全点。

## 8. Powerups 与恢复
- 武器、炸弹、勋章、fairy 和 hidden cache 奖励应出现在有意图的教学点或恢复点。
- 第一个武器拾取物应该容易被注意并收集。
- 隐藏奖励保持可选 bonus；不能 gate 主线推进或 Boss 入场。
- Checkpoint 应放在可读段落边界附近，避免把玩家重生进 staggered wave 陷阱。
- Easy-path 恢复应该保留紧张感，但避免一次失误后陷入死亡螺旋。

## 9. 美术方向
- Sprint 2 的 replacement assets 只算管线证明，不算最终视觉质量。
- Sprint 3 通过统一 sprite 比例、裁切、锚点、色温、子弹对比度和背景拼接来提升整体一致性。
- Stage 1 应该读起来像一个统一的街机射击场景，而不是低分辨率素材碎片混搭。
- 美术一致性工作优先采用 adapter/catalog 调整和小规模派生替换，不展开大规模找素材。
- 只要素材不直接遮蔽玩法可读性，就不要让最终美术 polish 阻塞 Sprint 3。

## 10. 音频方向
- Stage BGM 应该干净循环，并且在重复射击 SFX 下仍然保持背景层次，不能像卡住的 debug tone。
- 持续玩家射击必须可听见但不疲劳；敌人爆炸与拾取物音效要短暂突出。
- 玩家受击、重生、炸弹和 Boss phase cue 的优先级高于常规敌方开火。
- Sprint 3 可以调整音量、cue gating 和 event-edge 播放，但不扩成完整音频重设计。

## 11. 难度与调参
- `1P Solo + Easy` 是 Sprint 3 的调参基线。
- active-pilot opening survival 继续作为回归项，但 Sprint 3 的完成门槛升级为真人可玩的 boss-clear 质量。
- Hard cabinet 和 2P 需要保持 smoke/regression 可用，但不驱动 encounter 调参。
- 难度应来自可读压力、站位决策和 Boss pattern 变化，而不是单纯提高弹幕密度。

## 12. Sprint 3 实施计划
- `controls-onboarding-pass`：在 title/select/gameplay 中加入移动、射击、炸弹和慢速移动的操作教学。
- `art-cohesion-pass`：统一 replacement sprite 比例、锚点、子弹对比度、拾取物可见性和背景拼接。
- `stage1-route-expansion-pass`：把 Stage 1 扩展为五段路线，并以 easy-path 约 2-3 分钟进 Boss 为目标。
- `boss-pattern-pass`：用 deterministic 的瞄准与横向 pattern 变化替换当前过于规律的 Boss cadence。
- `boss-clear-flow-pass`：让 Boss 入场、阶段转换、Boss 击破和 Stage 1 clear 反馈成为完整体验。
- `sprint3-browser-acceptance`：增加 `title -> 1P Easy -> Stage 1 boss clear` 的 preview/人工验收证据。

## 13. 验收与 Playtest Checklist
- 玩家可以从 title 开始，选择 `1P Solo + Easy`，理解操作，并无困惑地进入 Stage 1。
- Stage 1 长度足以像一个紧凑小任务，并能抵达 Boss，中间不能出现空场或过早误入 Boss。
- Boss pattern 能覆盖停在固定位置的玩家，同时仍允许通过主动移动来闪避。
- Checkpoint、hidden route、pickup、Boss phase 和 clear flow 在浏览器 preview 中都能被理解。
- 自动化检查保持绿色：`npm run test:run`、coverage >= 80%、`npm run build`、`npm run validate:replacement-assets`。
- Sprint 3 完成前必须记录人工 preview 反馈，并区分 blocker 与非 blocker polish 问题。
