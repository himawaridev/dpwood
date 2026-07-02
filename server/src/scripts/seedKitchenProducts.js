require("dotenv").config();

const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");

const imageByCategory = {
    cookware: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=900&q=80",
    tableware: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80",
    utensils: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    storage: "https://images.unsplash.com/photo-1606914469633-bd39206ea739?auto=format&fit=crop&w=900&q=80",
    appliances: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=900&q=80",
    cleaning: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=900&q=80",
};

const productData = [
    ["Bộ nồi inox 304 Premium 5 món", "cookware", "Inox 304", "Bạc", "DPWOOD Kitchen", "Bộ 5 món", 1890000, 46, 31, true, false],
    ["Nồi lẩu inox đáy từ 28cm", "cookware", "Inox 304", "Bạc", "DPWOOD Kitchen", "28cm", 690000, 62, 18, true, false],
    ["Nồi áp suất mini 3L", "cookware", "Inox 304", "Đen", "Sunhouse", "3L", 1250000, 30, 12, false, false],
    ["Chảo chống dính đáy từ 24cm", "cookware", "Nhôm chống dính", "Đen", "DPWOOD Kitchen", "24cm", 390000, 80, 45, false, false],
    ["Chảo vân đá sâu lòng 28cm", "cookware", "Nhôm chống dính", "Xám", "Lock&Lock", "28cm", 560000, 68, 36, false, false],
    ["Chảo gang steak 26cm", "cookware", "Gang", "Đen", "DPWOOD Kitchen", "26cm", 720000, 38, 20, false, false],
    ["Quánh bột chống dính 18cm", "cookware", "Nhôm chống dính", "Kem", "Elmich", "18cm", 320000, 55, 17, false, false],
    ["Xửng hấp inox 2 tầng", "cookware", "Inox 304", "Bạc", "DPWOOD Kitchen", "2 tầng", 480000, 44, 19, true, false],
    ["Bộ nồi ceramic hồng pastel", "cookware", "Nhôm chống dính", "Hồng pastel", "DPWOOD Kitchen", "Bộ 3 món", 980000, 32, 15, false, false],
    ["Nồi kho cá chống dính 22cm", "cookware", "Nhôm chống dính", "Đỏ đô", "Sunhouse", "22cm", 430000, 50, 23, false, false],

    ["Bộ bát đĩa sứ trắng 12 món", "tableware", "Sứ", "Trắng", "DPWOOD Kitchen", "Bộ 12 món", 720000, 40, 29, true, true],
    ["Bộ chén cơm sứ 6 chiếc", "tableware", "Sứ", "Trắng", "DPWOOD Kitchen", "6 chiếc", 210000, 95, 51, true, true],
    ["Đĩa sứ phẳng 25cm", "tableware", "Sứ", "Kem", "Minh Long", "25cm", 165000, 120, 35, true, true],
    ["Tô ramen sứ sâu lòng", "tableware", "Sứ", "Xanh navy", "DPWOOD Kitchen", "900ml", 145000, 74, 33, true, true],
    ["Ly thủy tinh cao 420ml", "tableware", "Thủy tinh", "Trong suốt", "Luminarc", "420ml", 85000, 140, 67, true, false],
    ["Bộ ly thủy tinh 6 chiếc", "tableware", "Thủy tinh", "Trong suốt", "DPWOOD Kitchen", "6 chiếc", 360000, 64, 39, true, false],
    ["Bình nước thủy tinh 1.5L", "tableware", "Thủy tinh", "Trong suốt", "Lock&Lock", "1.5L", 230000, 58, 22, true, false],
    ["Khay phục vụ gỗ tự nhiên", "tableware", "Gỗ tự nhiên", "Gỗ tự nhiên", "DPWOOD Kitchen", "38x24cm", 260000, 43, 16, false, false],
    ["Bộ muỗng nĩa inox 24 món", "tableware", "Inox 304", "Bạc", "DPWOOD Kitchen", "24 món", 520000, 52, 31, true, false],
    ["Bộ đũa gỗ chống trượt 10 đôi", "tableware", "Gỗ tự nhiên", "Gỗ tự nhiên", "DPWOOD Kitchen", "10 đôi", 135000, 100, 58, false, false],

    ["Bộ dao bếp inox 5 món", "utensils", "Inox 304", "Đen", "DPWOOD Kitchen", "Bộ 5 món", 650000, 48, 27, false, false],
    ["Dao chef thép Đức 20cm", "utensils", "Inox 304", "Bạc", "DPWOOD Kitchen", "20cm", 420000, 36, 18, false, false],
    ["Thớt gỗ cao su kháng khuẩn", "utensils", "Gỗ tự nhiên", "Gỗ tự nhiên", "DPWOOD Kitchen", "35x25cm", 240000, 72, 41, false, false],
    ["Thớt nhựa phân màu 3 tấm", "utensils", "Nhựa an toàn thực phẩm", "Xanh mint", "DPWOOD Kitchen", "3 tấm", 195000, 88, 26, true, false],
    ["Bộ vá muỗng silicone 6 món", "utensils", "Silicone", "Hồng pastel", "DPWOOD Kitchen", "6 món", 315000, 76, 44, true, false],
    ["Kẹp gắp thực phẩm inox", "utensils", "Inox 304", "Bạc", "DPWOOD Kitchen", "30cm", 95000, 110, 63, true, false],
    ["Rây lọc inox cán dài", "utensils", "Inox 304", "Bạc", "DPWOOD Kitchen", "18cm", 115000, 86, 29, true, false],
    ["Dụng cụ bào rau củ đa năng", "utensils", "Inox 304", "Xám", "Lock&Lock", "3 lưỡi", 175000, 70, 34, true, false],
    ["Cây đánh trứng inox", "utensils", "Inox 304", "Bạc", "DPWOOD Kitchen", "28cm", 78000, 130, 74, true, false],
    ["Kéo nhà bếp đa năng", "utensils", "Inox 304", "Đen", "DPWOOD Kitchen", "21cm", 145000, 92, 39, false, false],

    ["Bộ hộp thủy tinh nắp kín 4 hộp", "storage", "Thủy tinh", "Trong suốt", "DPWOOD Kitchen", "4 hộp", 590000, 42, 28, true, true],
    ["Hộp cơm giữ nhiệt 1.2L", "storage", "Inox 304", "Xanh mint", "Lock&Lock", "1.2L", 430000, 58, 25, false, false],
    ["Bình giữ nhiệt inox 750ml", "storage", "Inox 304", "Đen", "DPWOOD Kitchen", "750ml", 280000, 84, 49, false, false],
    ["Hũ gia vị thủy tinh 12 hũ", "storage", "Thủy tinh", "Trong suốt", "DPWOOD Kitchen", "12 hũ", 360000, 60, 38, true, false],
    ["Kệ gia vị xoay 360 độ", "storage", "Nhựa an toàn thực phẩm", "Trắng", "DPWOOD Kitchen", "16 hũ", 520000, 35, 14, false, false],
    ["Giỏ đựng rau củ xếp tầng", "storage", "Nhựa an toàn thực phẩm", "Kem", "DPWOOD Kitchen", "3 tầng", 260000, 63, 24, true, false],
    ["Khay chia ngăn tủ lạnh", "storage", "Nhựa an toàn thực phẩm", "Trong suốt", "DPWOOD Kitchen", "4 ngăn", 180000, 96, 55, true, false],
    ["Túi zip silicone tái sử dụng", "storage", "Silicone", "Xanh mint", "DPWOOD Kitchen", "Bộ 6 túi", 225000, 74, 31, true, true],

    ["Máy xay sinh tố mini 600ml", "appliances", "Nhựa an toàn thực phẩm", "Trắng", "DPWOOD Kitchen", "600ml", 780000, 45, 22, false, false],
    ["Nồi chiên không dầu 5L", "appliances", "Nhựa an toàn thực phẩm", "Đen", "Sunhouse", "5L", 1890000, 28, 16, false, false],
    ["Ấm siêu tốc inox 1.8L", "appliances", "Inox 304", "Bạc", "DPWOOD Kitchen", "1.8L", 420000, 70, 46, false, false],
    ["Máy ép chậm compact", "appliances", "Nhựa an toàn thực phẩm", "Xám", "DPWOOD Kitchen", "500ml", 2250000, 18, 9, false, false],
    ["Máy đánh trứng cầm tay", "appliances", "Nhựa an toàn thực phẩm", "Trắng", "Philips", "5 tốc độ", 650000, 34, 12, false, false],
    ["Bếp điện từ đơn mặt kính", "appliances", "Thủy tinh", "Đen", "Sunhouse", "2000W", 990000, 40, 21, false, false],
    ["Máy pha cà phê mini", "appliances", "Nhựa an toàn thực phẩm", "Đỏ đô", "DPWOOD Kitchen", "650ml", 1580000, 22, 7, false, false],

    ["Bộ khăn lau bếp microfiber 5 chiếc", "cleaning", "Nhựa an toàn thực phẩm", "Xám", "DPWOOD Kitchen", "5 chiếc", 95000, 150, 88, true, false],
    ["Cọ rửa chai lọ cán dài", "cleaning", "Silicone", "Xanh mint", "DPWOOD Kitchen", "35cm", 68000, 120, 61, true, false],
    ["Bộ miếng rửa chén không xước", "cleaning", "Silicone", "Hồng pastel", "DPWOOD Kitchen", "Bộ 6 miếng", 79000, 170, 94, true, false],
    ["Kệ úp chén inox 2 tầng", "cleaning", "Inox 304", "Bạc", "DPWOOD Kitchen", "2 tầng", 690000, 36, 17, false, false],
    ["Thùng rác bếp nắp nhấn 12L", "cleaning", "Nhựa an toàn thực phẩm", "Trắng", "DPWOOD Kitchen", "12L", 260000, 44, 15, false, false],
];

const toProduct = (item) => {
    const [name, category, material, color, brand, capacity, price, stock, sold, dishwasherSafe, microwaveSafe] = item;
    const imageUrl = imageByCategory[category];
    const colors = [color, color === "Đen" ? "Bạc" : "Đen", color === "Trắng" ? "Hồng pastel" : "Trắng"];
    const sizes = category === "cookware"
        ? [capacity, "24cm", "28cm"]
        : category === "appliances"
          ? [capacity, "Bản tiêu chuẩn", "Bản lớn"]
          : [capacity, "Bộ nhỏ", "Bộ lớn"];
    const variantColors = colors.slice(0, 3);
    const variantSizes = sizes.slice(0, 3);
    const variantCount = variantColors.length * variantSizes.length;
    const baseVariantStock = Math.floor(Number(stock || 0) / variantCount);
    const extraVariantStock = Number(stock || 0) % variantCount;
    const variants = variantColors.flatMap((variantColor, colorIndex) =>
        variantSizes.map((variantSize, sizeIndex) => {
            const variantIndex = colorIndex * variantSizes.length + sizeIndex;

            return {
                variantId: `${name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${colorIndex + 1}-${sizeIndex + 1}`,
                color: variantColor,
                size: variantSize || capacity,
                price: Number(price) + sizeIndex * 30000,
                stock: Math.max(0, baseVariantStock + (variantIndex < extraVariantStock ? 1 : 0)),
                imageUrl,
            };
        }),
    );

    return {
        name,
        category,
        material,
        color,
        brand,
        capacity,
        price,
        stock,
        sold,
        dishwasherSafe,
        microwaveSafe,
        warranty: category === "appliances" ? "12 tháng" : "6 tháng",
        origin: "Việt Nam",
        imageUrl,
        images: [imageUrl],
        variants,
        stock: variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
        description: `${name} thuộc nhóm ${category}, màu ${color}, chất liệu ${material}. Sản phẩm phù hợp cho căn bếp gia đình, dễ sử dụng và dễ bảo quản.`,
    };
};

async function seedKitchenProducts() {
    await sequelize.authenticate();

    let created = 0;
    let updated = 0;

    for (const item of productData.map(toProduct)) {
        const existingProduct = await Product.findOne({ where: { name: item.name } });

        if (existingProduct) {
            await existingProduct.update(item);
            updated += 1;
        } else {
            await Product.create(item);
            created += 1;
        }
    }

    console.log(`Seed completed: ${created} created, ${updated} updated, ${productData.length} total.`);
    await sequelize.close();
}

seedKitchenProducts().catch(async (error) => {
    console.error("Seed kitchen products failed:", error);
    await sequelize.close();
    process.exit(1);
});
