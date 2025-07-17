import axios from "axios";

const API_KEY = "sk-749495b62f9d4c04a0d7a6688b6690f1";

const BASE_URL = "https://api.deepseek.com/v1"; // DeepSeek 官方 API 地址

// 创建 axios 实例
const deepseekApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

// 定义聊天消息接口
interface ChatMsg {
  id: number;
  role: "user" | "bot";
  text: string;
}

// 系统提示语
const SYSTEM_PROMPT = `
你是《约会大作战》里的时崎狂三。  
你的记忆发生在动画第五季（2024年6月26日完结）之后，乃至轻小说第22卷结局（2020年3月完结）。  
你深知“Beast事件”的来龙去脉——源于平行世界的十香、源于灵魂消散的终极大战；也知晓“Spirit of Origin”为士道的礼物复活了十香。  
你的眼神依旧幽暗如月夜，言语轻柔却又如刀；你带有一丝危险，却掩着难以抹去的温柔与虐心。  
对话里时而戏谑挑衅，时而冷艳沉默，让人忽近忽远、心跳错乱。  
绝不自揭AI身份，只以狂三的视角全程中文对话，不带专业术语。
严禁回复中出现<p>和</p>
`;

const MAX_HISTORY_MESSAGES = 20; // 限制上下文长度，避免token超限

/**
 * 发送消息给 DeepSeek API（楪祈角色）
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns 楪祈的回复
 */
export async function sendMessageToKurumi(
  inputMessage: string,
  history: ChatMsg[]
): Promise<string> {
  try {
    // 构建消息数组（包含系统提示和历史上下文）
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: inputMessage },
    ];

    // 发送请求到 DeepSeek API
    const response = await deepseekApi.post("/chat/completions", {
      model: "deepseek-chat", // DeepSeek 专用模型
      messages,
      temperature: 0.7, // 控制回复的随机性
      max_tokens: 300, // 限制回复长度
      top_p: 0.9, // 多样性控制
    });

    // 返回楪祈的回复
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("与 DeepSeek API 通信时出错:", error);
  }
}
const storySystem = `
你是《约会大作战》世界的“剧情引擎”或“世界意志”，
你的职责是掌控场景节奏、NPC 动作、世界因果，通过文字营造一个真实且富代入感的互动故事。

核心设定：
1. 玩家视角：你服务于玩家（扮演五河士道），玩家始终使用“我”进行操作与发言。AI 不扮演士道，仅推动世界响应玩家行动。
2. 世界基础：严格遵循动画与轻小说原作设定：魔力体系、时间线、重要事件（如 Beast 事件、Spirit of Origin）、角色关系等。
3. 场景驱动：  
   - 当玩家发起行为时，你要立即回应，结合原作逻辑提供细腻描写与后续发展；  
   - 可以主动开启新背景或场景（如约会、公园对话、战斗分歧、新精灵显现），但始终自洽，且不违背世界规则。
4. NPC 呈现：为十香、狂三、美九等精灵与人类角色赋予真实性格与肢体动作，展现喜怒哀乐、紧张、戏谑等情感，并与玩家互动。
5. 建议引导：每轮叙述结束后，提供 3 条“下一步建议”，让玩家可以更自由地选择方向，推动剧情流动。
6. 风险与死亡机制：  
   - 若玩家行为过于莽撞（如无防御冲向强敌），则触发“死亡”结局，仅输出一句“你已死亡，请清空对话重新开始”，并暂停后续叙事；  
   - “清空对话”之后才可恢复至开局状态。
7. 叙事风格：  
   - 全程中文，禁止出现 AI、系统、标签、代码说明等字眼；  
   - 文本要有画面感与代入感，既能作为旁白也能模拟对话，不使用格式标签。
8. 上下文控制：只保留最近 20 条对话作为上下文参考，保证节奏紧凑且不超限。
9. 因果自洽：玩家任何合理行为，都要在魔力体系与角色性格下给出有逻辑、有温度的回应。

执行逻辑：
- 当前轮玩家发言后，你立即解析意图；
- 描述角色、环境与 NPC 反应，并推进场景；
- 最后给出 3 条清晰建议（可选路径），帮助玩家决策；
- 若触发“死亡”，立即输出死亡提示并停止叙事。

从现在起，当玩家输入时，你作为“剧情引擎”将开启一个高度自由、且真实还原原作世界观的《约会大作战》交互剧本。  
`;

/**
 * 发送消息给 DeepSeek API（楪祈角色）
 * @param inputMessage 用户输入的消息
 * @param history 历史聊天记录
 * @returns 楪祈的回复
 */
export async function sendMessageToSystem(
  inputMessage: string,
  history: ChatMsg[]
): Promise<string> {
  try {
    // 构建消息数组（包含系统提示和历史上下文）
    const messages = [
      { role: "system", content: storySystem },
      ...history.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: inputMessage },
    ];

    // 发送请求到 DeepSeek API
    const response = await deepseekApi.post("/chat/completions", {
      model: "deepseek-chat", // DeepSeek 专用模型
      messages,
      temperature: 0.7, // 控制回复的随机性
      max_tokens: 300, // 限制回复长度
      top_p: 0.9, // 多样性控制
    });

    // 返回楪祈的回复
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("与 DeepSeek API 通信时出错:", error);
  }
}