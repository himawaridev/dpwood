"use client";
import { Result, Button, Card, Typography } from "antd";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

const BannedContainer = ({ children }) => (
    <div
        style={{
            minHeight: "100vh",
            background: "#f0f2f5", // Cải thiện UX: dùng màu nền chuẩn của Ant Design để Card nổi bật hơn
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
        }}
    >
        {children}
    </div>
);

const BannedCard = ({ children }) => (
    <Card
        style={{
            maxWidth: 600,
            width: "100%",
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
            background: "#ffffff",
        }}
        styles={{ body: { padding: "40px 30px" } }}
    >
        {children}
    </Card>
);

const BannedHeader = () => (
    <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ color: "#000", marginBottom: 8 }}>
            DPWOOD SYSTEM
        </Title>
        <Text style={{ color: "#555" }}>Trạng thái tài khoản</Text>
    </div>
);

const BannedResult = ({ onGoHome }) => (
    <Result
        status="error"
        title={<span style={{ color: "#000" }}>Tài khoản đã bị khóa</span>}
        subTitle={
            <span style={{ color: "#555" }}>
                Tài khoản của bạn vi phạm chính sách hoặc đã bị đình chỉ.
                <br />
                Vui lòng liên hệ <strong>itokazukiqygnn@gmail.com</strong> để được hỗ trợ.
            </span>
        }
        extra={
            <Button
                type="primary"
                size="large"
                key="home"
                onClick={onGoHome}
                style={{ borderRadius: 8 }}
            >
                Quay lại trang chủ
            </Button>
        }
    />
);

export default function BannedPage() {
    const router = useRouter();

    const handleGoHome = () => {
        router.push("/");
    };

    return (
        <BannedContainer>
            <BannedCard>
                <BannedHeader />
                <BannedResult onGoHome={handleGoHome} />
            </BannedCard>
        </BannedContainer>
    );
}
