import { useState } from "react";
import { App, Button, Divider, Flex, Input, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function CreatableSelect({ options, onAddOption, addLabel, value, onChange, ...selectProps }) {
    const { message } = App.useApp();
    const [newOption, setNewOption] = useState("");
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAdd = async () => {
        const label = newOption.trim();
        if (!label) {
            message.warning(`Vui lòng nhập ${addLabel.toLowerCase()}.`);
            return;
        }

        try {
            setAdding(true);
            const created = await onAddOption(label);
            onChange?.(created?.value || label);
            setNewOption("");
            setOpen(false);
        } catch (error) {
            message.error(error.response?.data?.message || `Không thể thêm ${addLabel.toLowerCase()}.`);
        } finally {
            setAdding(false);
        }
    };

    return (
        <Flex gap={8} align="center">
            <Select
                {...selectProps}
                value={value}
                onChange={onChange}
                open={open}
                onOpenChange={setOpen}
                options={options}
                style={{ flex: 1, minWidth: 0 }}
                popupRender={(menu) => (
                    <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Flex gap={8} style={{ padding: "0 8px 8px" }}>
                            <Input
                                value={newOption}
                                placeholder={`Nhập ${addLabel.toLowerCase()} mới`}
                                onChange={(event) => setNewOption(event.target.value)}
                                onKeyDown={(event) => event.stopPropagation()}
                                onPressEnter={(event) => {
                                    event.preventDefault();
                                    handleAdd();
                                }}
                            />
                            <Button
                                type="text"
                                icon={<PlusOutlined />}
                                loading={adding}
                                aria-label={`Thêm ${addLabel.toLowerCase()}`}
                                onClick={handleAdd}
                            />
                        </Flex>
                    </>
                )}
            />
            <Button
                icon={<PlusOutlined />}
                aria-label={`Mở phần thêm ${addLabel.toLowerCase()}`}
                onClick={() => setOpen(true)}
            />
        </Flex>
    );
}
