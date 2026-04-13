const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const Blog = sequelize.define(
    "Blog",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, unique: true, allowNull: false }, // VD: meo-bao-quan-do-go
        thumbnail: { type: DataTypes.STRING, allowNull: true }, // Link ảnh bìa bài viết
        summary: { type: DataTypes.TEXT, allowNull: true }, // Đoạn tóm tắt ngắn hiện ở ngoài danh sách
        content: { type: DataTypes.TEXT("long"), allowNull: false }, // Nội dung chi tiết (HTML)
        author: { type: DataTypes.STRING, defaultValue: "Admin" },
        views: { type: DataTypes.INTEGER, defaultValue: 0 },
        isPublished: { type: DataTypes.BOOLEAN, defaultValue: true }, // Trạng thái: Đã xuất bản hay Bản nháp
        metaTitle: { type: DataTypes.STRING, allowNull: true }, // Tiêu đề hiển thị trên Google
        metaDescription: { type: DataTypes.STRING, allowNull: true }, // Dòng chữ nhỏ mô tả trên Google
        metaKeywords: { type: DataTypes.STRING, allowNull: true }, // Từ khóa (VD: ban go soi, noi that...)
    },
    { timestamps: true },
);

module.exports = Blog;
