import BackButton from "@/components/ui/BackButton";
import Icon from "@/components/ui/Icon";

const PROVIDERS = [
  {
    name: "Claude (Anthropic)",
    icon: "sparkles",
    color: "#D97706",
    bg: "#FFFBEB",
    steps: [
      "console.anthropic.com 에 접속합니다.",
      "회원가입 후 로그인합니다.",
      "좌측 메뉴에서 'API Keys'를 클릭합니다.",
      "'Create Key' 버튼을 눌러 새 키를 생성합니다.",
      "생성된 키(sk-ant-...)를 복사하여 kiddoloop 설정에 붙여넣습니다.",
    ],
    note: "Claude API는 사용량 기반 과금입니다. 요금제 및 가격은 Anthropic 공식 사이트에서 확인하세요.",
  },
  {
    name: "ChatGPT (OpenAI)",
    icon: "zap",
    color: "#059669",
    bg: "#F0FDF4",
    steps: [
      "platform.openai.com 에 접속합니다.",
      "회원가입 후 로그인합니다.",
      "우측 상단 프로필 > 'API keys'를 클릭합니다.",
      "'Create new secret key'를 눌러 새 키를 생성합니다.",
      "생성된 키(sk-...)를 복사하여 kiddoloop 설정에 붙여넣습니다.",
    ],
    note: "OpenAI API는 사용량 기반 과금입니다. 요금제 및 가격은 OpenAI 공식 사이트에서 확인하세요.",
  },
  {
    name: "Gemini (Google)",
    icon: "star",
    color: "#2563EB",
    bg: "#EFF6FF",
    steps: [
      "aistudio.google.com 에 접속합니다.",
      "Google 계정으로 로그인합니다.",
      "좌측 메뉴에서 'Get API key'를 클릭합니다.",
      "'Create API key' 버튼을 눌러 키를 생성합니다.",
      "생성된 키를 복사하여 kiddoloop 설정에 붙여넣습니다.",
    ],
    note: "Gemini API는 무료 티어가 제공되며, 사용량 초과 시 과금될 수 있습니다. 자세한 내용은 Google AI 공식 사이트에서 확인하세요.",
  },
];

export default function AiGuidePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F5F5F5", padding: 24 }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackButton />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#13241B", margin: 0 }}>AI 토큰 발급 가이드</h1>
        </div>

        {/* 면책 안내 */}
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          padding: "14px 16px", borderRadius: 14,
          background: "#FEF9C3", border: "1px solid #FDE68A",
          marginBottom: 20,
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>
            <Icon name="alert-triangle" size={18} color="#92400E" stroke={2.2} />
          </span>
          <div style={{ fontSize: 13, color: "#78350F", fontWeight: 600, lineHeight: 1.7 }}>
            각 AI 서비스의 인터페이스는 버전에 따라 다를 수 있습니다.
            API 사용 시 각 서비스의 요금제에 따라 비용이 발생할 수 있으며,
            kiddoloop은 외부 AI 서비스의 요금에 대해 책임지지 않습니다.
            정확한 요금은 각 서비스의 공식 웹사이트에서 확인해주세요.
          </div>
        </div>

        {/* 제공사별 가이드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              style={{
                background: "#fff", borderRadius: 18,
                boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                overflow: "hidden",
              }}
            >
              {/* 헤더 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 18px",
                background: provider.bg,
                borderBottom: "1px solid rgba(0,0,0,.04)",
              }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                }}>
                  <Icon name={provider.icon} size={22} color={provider.color} stroke={2} />
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#13241B" }}>
                  {provider.name}
                </span>
              </div>

              {/* 단계 */}
              <div style={{ padding: "16px 18px" }}>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {provider.steps.map((step, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13.5, color: "#334155", fontWeight: 600,
                        lineHeight: 1.8, marginBottom: i < provider.steps.length - 1 ? 4 : 0,
                      }}
                    >
                      {step}
                    </li>
                  ))}
                </ol>

                {/* 요금 안내 */}
                <div style={{
                  marginTop: 14, padding: "10px 12px", borderRadius: 10,
                  background: "#F8FAFC", border: "1px solid #E2E8F0",
                  fontSize: 12, color: "#64748B", fontWeight: 600, lineHeight: 1.6,
                }}>
                  {provider.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 보안 안내 */}
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          padding: "14px 16px", borderRadius: 14,
          background: "#E9F4EC",
          marginTop: 20, marginBottom: 40,
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>
            <Icon name="lock" size={16} color="#16A34A" stroke={2.2} />
          </span>
          <div style={{ fontSize: 12.5, color: "#15803D", fontWeight: 600, lineHeight: 1.7 }}>
            입력한 토큰은 이 기기(브라우저)에만 저장됩니다.
            서버에 전송되거나 데이터베이스에 기록되지 않습니다.
          </div>
        </div>
      </div>
    </main>
  );
}
