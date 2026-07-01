import React, { useEffect, useMemo, useState } from "react";
import {
    Card,
    Button,
    Typography,
    Space,
    Tag,
    Flex,
    Modal,
    Form,
    Input,
    Radio,
    Popconfirm,
    Select,
    Alert,
} from "antd";
import { EnvironmentOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const PHONE_PREFIX_OPTIONS = [
    { value: "+84", label: "+84 Việt Nam" },
    { value: "+1", label: "+1 US/Canada" },
    { value: "+81", label: "+81 Nhật Bản" },
    { value: "+82", label: "+82 Hàn Quốc" },
    { value: "+86", label: "+86 Trung Quốc" },
    { value: "+65", label: "+65 Singapore" },
];

const toLocationOptions = (items = []) =>
    items.map((item) => ({
        value: String(item.code),
        label: item.name,
    }));

const fetchLocation = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Cannot load address data");
    return response.json();
};

const formatPhoneNumber = (phoneNumber = "") => {
    if (phoneNumber.startsWith("+")) return phoneNumber;
    if (phoneNumber.startsWith("0")) return `+84${phoneNumber.slice(1)}`;
    return phoneNumber;
};

export default function AddressSection({
    isAuth,
    addresses,
    selectedAddress,
    setSelectedAddress,
    isAddressModalVisible,
    setIsAddressModalVisible,
    isAddingAddress,
    setIsAddingAddress,
    addressForm,
    handleSaveNewAddress,
    handleDeleteAddress,
}) {
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [wardOptions, setWardOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");

    const phonePrefix = Form.useWatch("phoneCountryCode", addressForm) || "+84";

    const phoneValidator = useMemo(
        () => async (_, value) => {
            const digits = String(value || "").replace(/\D/g, "");
            if (!digits) throw new Error("Vui lòng nhập số điện thoại");

            if (phonePrefix === "+84") {
                let nationalNumber = digits;
                if (nationalNumber.startsWith("84")) nationalNumber = nationalNumber.slice(2);
                if (nationalNumber.startsWith("0")) nationalNumber = nationalNumber.slice(1);

                if (nationalNumber.length !== 9) {
                    throw new Error("+84 cần đủ 9 chữ số sau mã quốc gia, ví dụ 0912345678.");
                }
                return;
            }

            if (digits.length < 6 || digits.length > 14) {
                throw new Error("Số điện thoại cần từ 6 đến 14 chữ số.");
            }
        },
        [phonePrefix],
    );

    useEffect(() => {
        if (!isAddressModalVisible || !isAddingAddress) return;

        const currentName = addressForm.getFieldValue("recipientName");
        const currentPrefix = addressForm.getFieldValue("phoneCountryCode");

        addressForm.setFieldsValue({
            recipientName: currentName || localStorage.getItem("userName") || "",
            phoneCountryCode: currentPrefix || "+84",
        });

        if (provinceOptions.length > 0) return;

        let cancelled = false;
        setLocationLoading(true);
        setLocationError("");

        fetchLocation("https://provinces.open-api.vn/api/?depth=1")
            .then((data) => {
                if (!cancelled) setProvinceOptions(toLocationOptions(data));
            })
            .catch(() => {
                if (!cancelled) setLocationError("Không thể tải danh sách tỉnh/thành. Vui lòng thử lại.");
            })
            .finally(() => {
                if (!cancelled) setLocationLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [addressForm, isAddingAddress, isAddressModalVisible, provinceOptions.length]);

    const handleProvinceChange = async (value, option) => {
        addressForm.setFieldsValue({
            provinceName: option?.label,
            districtCode: undefined,
            districtName: undefined,
            wardCode: undefined,
            wardName: undefined,
        });
        setDistrictOptions([]);
        setWardOptions([]);
        setLocationLoading(true);
        setLocationError("");

        try {
            const data = await fetchLocation(`https://provinces.open-api.vn/api/p/${value}?depth=2`);
            setDistrictOptions(toLocationOptions(data.districts));
        } catch {
            setLocationError("Không thể tải danh sách quận/huyện. Vui lòng chọn lại tỉnh/thành.");
        } finally {
            setLocationLoading(false);
        }
    };

    const handleDistrictChange = async (value, option) => {
        addressForm.setFieldsValue({
            districtName: option?.label,
            wardCode: undefined,
            wardName: undefined,
        });
        setWardOptions([]);
        setLocationLoading(true);
        setLocationError("");

        try {
            const data = await fetchLocation(`https://provinces.open-api.vn/api/d/${value}?depth=2`);
            setWardOptions(toLocationOptions(data.wards));
        } catch {
            setLocationError("Không thể tải danh sách phường/xã. Vui lòng chọn lại quận/huyện.");
        } finally {
            setLocationLoading(false);
        }
    };

    if (!isAuth) return null;

    return (
        <>
            <Card
                variant="outlined"
                className="dp-panel"
                style={{ marginBottom: 22 }}
                styles={{ body: { padding: "20px 24px" } }}
            >
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <Title
                            level={5}
                            style={{
                                color: "var(--dp-primary)",
                                marginTop: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <EnvironmentOutlined /> Địa chỉ nhận hàng
                        </Title>
                        {selectedAddress ? (
                            <Space size="middle" wrap>
                                <Text strong style={{ fontSize: 16 }}>
                                    {selectedAddress.recipientName} {formatPhoneNumber(selectedAddress.phoneNumber)}
                                </Text>
                                <Text className="dp-muted">{selectedAddress.fullAddress}</Text>
                                {selectedAddress.isDefault && <Tag color="success">Mặc định</Tag>}
                            </Space>
                        ) : (
                            <Text type="danger">Vui lòng thêm địa chỉ giao hàng để tiếp tục.</Text>
                        )}
                    </div>
                    <Button onClick={() => setIsAddressModalVisible(true)}>
                        {selectedAddress ? "Thay đổi địa chỉ" : "Thêm địa chỉ"}
                    </Button>
                </Flex>
            </Card>

            <Modal
                title={isAddingAddress ? "Thêm địa chỉ mới" : "Địa chỉ của tôi"}
                open={isAddressModalVisible}
                onCancel={() => {
                    setIsAddressModalVisible(false);
                    setIsAddingAddress(false);
                }}
                footer={null}
                width={720}
                forceRender
            >
                <div style={{ display: isAddingAddress ? "block" : "none", marginTop: 16 }}>
                    <Form form={addressForm} layout="vertical" onFinish={handleSaveNewAddress}>
                        {locationError && (
                            <Alert
                                type="warning"
                                showIcon
                                message={locationError}
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Form.Item
                            name="recipientName"
                            label="Họ và tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                            <Input size="large" placeholder="Tên người nhận" />
                        </Form.Item>

                        <Flex gap={12} wrap="wrap">
                            <Form.Item
                                name="phoneCountryCode"
                                label="Mã vùng"
                                initialValue="+84"
                                rules={[{ required: true, message: "Chọn mã vùng" }]}
                                style={{ flex: "0 0 150px" }}
                            >
                                <Select size="large" options={PHONE_PREFIX_OPTIONS} />
                            </Form.Item>
                            <Form.Item
                                name="phoneLocalNumber"
                                label="Số điện thoại"
                                rules={[{ validator: phoneValidator }]}
                                style={{ flex: "1 1 260px" }}
                            >
                                <Input size="large" placeholder="0912345678" inputMode="tel" />
                            </Form.Item>
                        </Flex>

                        <Flex gap={12} wrap="wrap">
                            <Form.Item
                                name="provinceCode"
                                label="Tỉnh/Thành phố"
                                rules={[{ required: true, message: "Vui lòng chọn tỉnh/thành" }]}
                                style={{ flex: "1 1 200px" }}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    loading={locationLoading}
                                    options={provinceOptions}
                                    optionFilterProp="label"
                                    placeholder="Chọn tỉnh/thành"
                                    onChange={handleProvinceChange}
                                />
                            </Form.Item>
                            <Form.Item
                                name="districtCode"
                                label="Quận/Huyện"
                                rules={[{ required: true, message: "Vui lòng chọn quận/huyện" }]}
                                style={{ flex: "1 1 200px" }}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    loading={locationLoading}
                                    disabled={districtOptions.length === 0}
                                    options={districtOptions}
                                    optionFilterProp="label"
                                    placeholder="Chọn quận/huyện"
                                    onChange={handleDistrictChange}
                                />
                            </Form.Item>
                            <Form.Item
                                name="wardCode"
                                label="Phường/Xã"
                                rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
                                style={{ flex: "1 1 200px" }}
                            >
                                <Select
                                    size="large"
                                    showSearch
                                    loading={locationLoading}
                                    disabled={wardOptions.length === 0}
                                    options={wardOptions}
                                    optionFilterProp="label"
                                    placeholder="Chọn phường/xã"
                                    onChange={(_, option) => addressForm.setFieldValue("wardName", option?.label)}
                                />
                            </Form.Item>
                        </Flex>

                        <Form.Item name="provinceName" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="districtName" hidden>
                            <Input />
                        </Form.Item>
                        <Form.Item name="wardName" hidden>
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="streetAddress"
                            label="Địa chỉ cụ thể"
                            rules={[{ required: true, message: "Vui lòng nhập số nhà, tên đường" }]}
                        >
                            <Input.TextArea
                                size="large"
                                rows={3}
                                placeholder="Số nhà, tên đường, tòa nhà, ghi chú giao hàng..."
                            />
                        </Form.Item>

                        <Flex justify="flex-end" gap="small">
                            <Button size="large" onClick={() => setIsAddingAddress(false)}>
                                Quay lại
                            </Button>
                            <Button size="large" type="primary" htmlType="submit">
                                Hoàn thành
                            </Button>
                        </Flex>
                    </Form>
                </div>

                <div style={{ display: !isAddingAddress ? "block" : "none", marginTop: 16 }}>
                    {addresses.length === 0 ? (
                        <Text type="secondary">Bạn chưa có địa chỉ nào. Hãy thêm mới.</Text>
                    ) : (
                        <Radio.Group
                            style={{ width: "100%" }}
                            value={selectedAddress?.id}
                            onChange={(e) =>
                                setSelectedAddress(addresses.find((a) => a.id === e.target.value))
                            }
                        >
                            <Flex vertical gap={12} style={{ width: "100%" }}>
                                {addresses.map((addr) => (
                                    <Card
                                        key={addr.id}
                                        size="small"
                                        hoverable
                                        onClick={() => setSelectedAddress(addr)}
                                        style={{
                                            borderColor:
                                                selectedAddress?.id === addr.id
                                                    ? "var(--dp-primary)"
                                                    : "var(--dp-soft-border)",
                                            background:
                                                selectedAddress?.id === addr.id
                                                    ? "#eaf7f4"
                                                    : "#fff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Flex justify="space-between" align="flex-start" gap={12}>
                                            <Radio value={addr.id}>
                                                <Text strong>{addr.recipientName}</Text>
                                                <Text type="secondary" style={{ marginLeft: 8 }}>
                                                    {formatPhoneNumber(addr.phoneNumber)}
                                                </Text>
                                                <div style={{ marginTop: 8, color: "var(--dp-muted)" }}>
                                                    {addr.fullAddress}
                                                </div>
                                            </Radio>
                                            <div
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Popconfirm
                                                    title="Xóa địa chỉ này?"
                                                    description="Hành động này không thể hoàn tác."
                                                    onConfirm={(e) => {
                                                        e?.stopPropagation();
                                                        handleDeleteAddress(addr.id);
                                                    }}
                                                    onCancel={(e) => e?.stopPropagation()}
                                                    okText="Xóa"
                                                    cancelText="Quay lại"
                                                >
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </Popconfirm>
                                            </div>
                                        </Flex>
                                    </Card>
                                ))}
                            </Flex>
                        </Radio.Group>
                    )}
                    <Button
                        type="dashed"
                        block
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddingAddress(true)}
                        style={{ marginTop: 24 }}
                    >
                        Thêm địa chỉ mới
                    </Button>
                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={() => setIsAddressModalVisible(false)}
                        style={{ marginTop: 12 }}
                        disabled={!selectedAddress && addresses.length > 0}
                    >
                        Xác nhận
                    </Button>
                </div>
            </Modal>
        </>
    );
}
