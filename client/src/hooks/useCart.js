import { message } from "antd";
import { useRouter } from "next/navigation";

/**
 * Hook tập trung logic giỏ hàng.
 * Dùng chung ở tất cả các trang: homepage, products, product detail.
 */
export function useCart() {
    const router = useRouter();

    /**
     * Thêm sản phẩm vào giỏ hàng (không redirect).
     */
    const addToCart = (product, quantity = 1) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const cartItemId = product.cartItemId || product.id;
        const existingIndex = cart.findIndex((item) => (item.cartItemId || item.productId) === cartItemId);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                cartItemId,
                productId: product.id,
                variantId: product.variantId || "",
                variantLabel: product.variantLabel || "",
                variantSnapshot: product.variantSnapshot || null,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || (product.images && product.images[0]),
                quantity,
            });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        return cart;
    };

    /**
     * Thêm vào giỏ rồi chuyển hướng đến /cart.
     */
    const buyNow = (product, quantity = 1) => {
        addToCart(product, quantity);
        message.success(`Đã thêm ${product.name} vào giỏ hàng`);
        router.push("/cart");
    };

    return { addToCart, buyNow };
}
