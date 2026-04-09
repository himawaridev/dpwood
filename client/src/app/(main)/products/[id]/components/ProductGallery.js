import React from "react";
import { Image, Flex } from "antd";

export default function ProductGallery({ activeImage, setActiveImage, imageList, productName }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
                style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#fafafa",
                }}
            >
                <Image
                    src={activeImage}
                    alt={productName}
                    style={{
                        width: "100%",
                        maxHeight: "550px",
                        borderRadius: "8px",
                        objectFit: "contain",
                    }}
                />
            </div>

            {imageList.length > 1 && (
                <Flex gap="small" style={{ overflowX: "auto", paddingBottom: "8px" }}>
                    {imageList.map((img, index) => (
                        <div
                            key={index}
                            onClick={() => setActiveImage(img)}
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "8px",
                                border:
                                    activeImage === img ? "2px solid #1677ff" : "1px solid #d9d9d9",
                                overflow: "hidden",
                                cursor: "pointer",
                                opacity: activeImage === img ? 1 : 0.6,
                                transition: "all 0.3s ease",
                                flexShrink: 0,
                            }}
                        >
                            <Image
                                src={img}
                                preview={false}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                alt={`Thumbnail ${index + 1}`}
                            />
                        </div>
                    ))}
                </Flex>
            )}
        </div>
    );
}
