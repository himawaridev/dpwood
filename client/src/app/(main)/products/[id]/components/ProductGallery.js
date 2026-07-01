import React from "react";
import { Image, Flex } from "antd";

export default function ProductGallery({ activeImage, setActiveImage, imageList, productName }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
                style={{
                    border: "1px solid var(--dp-soft-border)",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--dp-surface-muted)",
                    aspectRatio: "1 / 1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Image
                    src={activeImage}
                    alt={productName}
                    preview
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                    }}
                />
            </div>

            {imageList.length > 1 && (
                <Flex gap={10} style={{ overflowX: "auto", paddingBottom: 4 }}>
                    {imageList.map((img, index) => (
                        <button
                            key={img}
                            type="button"
                            onClick={() => setActiveImage(img)}
                            style={{
                                width: 78,
                                height: 78,
                                borderRadius: 8,
                                border:
                                    activeImage === img
                                        ? "2px solid var(--dp-primary)"
                                        : "1px solid var(--dp-border)",
                                overflow: "hidden",
                                cursor: "pointer",
                                opacity: activeImage === img ? 1 : 0.7,
                                background: "#fff",
                                flexShrink: 0,
                                padding: 0,
                            }}
                        >
                            <Image
                                src={img}
                                preview={false}
                                className="dp-image-cover"
                                alt={`${productName} ${index + 1}`}
                            />
                        </button>
                    ))}
                </Flex>
            )}
        </div>
    );
}
