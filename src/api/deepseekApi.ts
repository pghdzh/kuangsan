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
