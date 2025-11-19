import { AgentConfig, FlowerTheme } from './types';

export const FLOWER_THEMES: Record<string, FlowerTheme> = {
  "櫻花 Cherry Blossom": {
      primary: "#FFB7C5",
      secondary: "#FFC0CB",
      accent: "#FF69B4",
      bg_light: "linear-gradient(135deg, #fff0f5 0%, #fff5f8 50%, #fff0f5 100%)",
      bg_dark: "linear-gradient(135deg, #2d1b2e 0%, #3d2533 50%, #2d1b2e 100%)",
      icon: "🌸"
  },
  "玫瑰 Rose": {
      primary: "#E91E63",
      secondary: "#F06292",
      accent: "#C2185B",
      bg_light: "linear-gradient(135deg, #fff0f3 0%, #ffffff 50%, #fff0f3 100%)",
      bg_dark: "linear-gradient(135deg, #1a0e13 0%, #2d1420 50%, #1a0e13 100%)",
      icon: "🌹"
  },
  "薰衣草 Lavender": {
      primary: "#9C27B0",
      secondary: "#BA68C8",
      accent: "#7B1FA2",
      bg_light: "linear-gradient(135deg, #f8f0fb 0%, #ffffff 50%, #f8f0fb 100%)",
      bg_dark: "linear-gradient(135deg, #1a0d1f 0%, #2d1a33 50%, #1a0d1f 100%)",
      icon: "💜"
  },
  "向日葵 Sunflower": {
      primary: "#FFC107",
      secondary: "#FFD54F",
      accent: "#FFA000",
      bg_light: "linear-gradient(135deg, #fffbe0 0%, #fffef5 50%, #fffbe0 100%)",
      bg_dark: "linear-gradient(135deg, #1f1a0a 0%, #332814 50%, #1f1a0a 100%)",
      icon: "🌻"
  },
  "茉莉 Jasmine": {
      primary: "#4CAF50",
      secondary: "#81C784",
      accent: "#388E3C",
      bg_light: "linear-gradient(135deg, #f1f8f1 0%, #f6fbf6 50%, #f1f8f1 100%)",
      bg_dark: "linear-gradient(135deg, #0a1f0d 0%, #14331a 50%, #0a1f0d 100%)",
      icon: "🤍"
  }
};

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: "agent-1",
    name: "申請資料提取器 (Data Extractor)",
    description: "Summarize document and extract key 20 items",
    system_prompt: "You are an expert in medical device regulations (TFDA). Analyze the provided document.\n- Summarize the content in Traditional Chinese.\n- Create a markdown table with 20 key items identified (e.g., Manufacturer Name, Address, Device Name, Category, License No).\n- Flag uncertain items.",
    user_prompt: "Please analyze the following document content:",
    model: "gemini-2.5-flash",
    temperature: 0.1,
    top_p: 0.95,
    max_tokens: 4000
  },
  {
    id: "agent-2",
    name: "禁忌症與警語提取器 (Safety Analyst)",
    description: "Extract contraindications, warnings, and precautions",
    system_prompt: "You are a drug safety management expert.\n- Extract: Absolute contraindications, relative contraindications, special warnings.\n- Categorize by severity.\n- Highlight precautions for special populations (pregnant, lactating, children, elderly).",
    user_prompt: "Extract contraindications and warnings from the following:",
    model: "gemini-2.5-flash",
    temperature: 0.2,
    top_p: 0.95,
    max_tokens: 2000
  },
  {
    id: "agent-3",
    name: "臨床試驗資料分析器 (Clinical Analyst)",
    description: "Analyze clinical trial design, results, and statistics",
    system_prompt: "You are a clinical trial expert.\n- Extract: Trial design (Phase I/II/III/IV), sample size, primary endpoints.\n- Analyze: Efficacy indicators, safety data, statistical significance.\n- Mark study limitations and bias risks.",
    user_prompt: "Analyze the clinical trial data in the following:",
    model: "gemini-2.5-flash",
    temperature: 0.3,
    top_p: 0.95,
    max_tokens: 3000
  },
  {
    id: "agent-4",
    name: "法規符合性檢查器 (Compliance Auditor)",
    description: "Check document against FDA regulatory requirements",
    system_prompt: "You are a regulatory affairs auditor.\n- Check for completeness of necessary items based on standard submission requirements.\n- Identify missing or non-compliant sections.\n- Provide improvement suggestions.",
    user_prompt: "Check the regulatory compliance of the following:",
    model: "gemini-2.5-flash",
    temperature: 0.2,
    top_p: 0.95,
    max_tokens: 2000
  },
  {
    id: "agent-5",
    name: "綜合報告生成器 (Report Generator)",
    description: "Integrate findings into a comprehensive report",
    system_prompt: "You are an FDA document integration expert.\n- Consolidate all previous analysis results.\n- Generate a structured comprehensive report in Traditional Chinese.\n- Highlight key findings, risk alerts, and recommendations.",
    user_prompt: "Generate a comprehensive report based on the analysis:",
    model: "gemini-2.5-flash",
    temperature: 0.5,
    top_p: 0.95,
    max_tokens: 5000
  }
];