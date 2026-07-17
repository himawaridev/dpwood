export const addCatalogProductToCart = (product, imageUrl = product?.imageUrl) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartItemId = product.id;
    const existingItem = cart.find((item) => (item.cartItemId || item.productId) === cartItemId);

    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity || 0) + 1;
    } else {
        cart.push({
            cartItemId,
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl,
            quantity: 1,
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
};
