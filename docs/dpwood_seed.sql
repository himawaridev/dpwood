CREATE DATABASE IF NOT EXISTS dpwood_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dpwood_db;

INSERT INTO users (
  id, avatarUrl, name, username, password, email, phone, role, isVerified,
  loginAttempts, createdAt, updatedAt
)
SELECT
  UUID(), NULL, 'DPWOOD Admin', 'admin',
  '$2b$10$OqVIeM5bdhFVERm9V/tbtOiFVo/2oIBe8djzKQ/m1skMbgaDVkPNy',
  'admin@dpwood.store', '0900000000', 'root', 1, 0, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@dpwood.store'
);

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Ban go soi Nordic',
  'Ban an go soi phong cach toi gian, phu hop can ho hien dai.',
  4200000, 12,
  'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=900&q=80'),
  18, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Ban go soi Nordic');

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Ghe lounge go tu nhien',
  'Ghe thu gian khung go chac chan, dem boc vai trung tinh.',
  2850000, 20,
  'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80'),
  31, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Ghe lounge go tu nhien');

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Ke sach Modular',
  'Ke sach go nhieu ngan, de mo rong theo khong gian lam viec.',
  3650000, 8,
  'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=900&q=80'),
  14, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Ke sach Modular');

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Tu console Walnut',
  'Tu console mau walnut, mat canh phang va chan cao thanh lich.',
  5900000, 6,
  'https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1602872030490-4a484a7b3ba6?auto=format&fit=crop&w=900&q=80'),
  9, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Tu console Walnut');

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Ban tra mat tron',
  'Ban tra go mat tron, kich thuoc gon cho phong khach nho.',
  2150000, 16,
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=80'),
  27, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Ban tra mat tron');

INSERT INTO Products (id, name, description, price, stock, imageUrl, images, sold, createdAt, updatedAt)
SELECT UUID(), 'Giuong go Minimal',
  'Giuong go khung thap, thiet ke chac chan va de phoi noi that.',
  7800000, 5,
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
  JSON_ARRAY('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'),
  11, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE name = 'Giuong go Minimal');

INSERT INTO Discounts (code, percentage, description, expiryDate, isActive, createdAt, updatedAt)
SELECT 'DPWOOD10', 10, 'Giam 10% cho don hang dau tien', DATE_ADD(NOW(), INTERVAL 90 DAY), 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Discounts WHERE code = 'DPWOOD10');

INSERT INTO Discounts (code, percentage, description, expiryDate, isActive, createdAt, updatedAt)
SELECT 'FREESHIP', 5, 'Ho tro phi giao hang cho don noi that', DATE_ADD(NOW(), INTERVAL 60 DAY), 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Discounts WHERE code = 'FREESHIP');

INSERT INTO Notifications (title, content, type, isActive, startTime, endTime, createdAt, updatedAt)
SELECT 'Chao mung den DPWOOD',
  'Website dang co san cac san pham noi that go mau de ban trai nghiem luong mua hang.',
  'success', 1, NULL, NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Notifications WHERE title = 'Chao mung den DPWOOD');

INSERT INTO Blogs (
  title, slug, thumbnail, summary, content, author, views, isPublished,
  metaTitle, metaDescription, metaKeywords, createdAt, updatedAt
)
SELECT
  'Cach chon noi that go cho can ho hien dai',
  'cach-chon-noi-that-go-cho-can-ho-hien-dai',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80',
  'Nhung goi y nhanh de chon ban, ghe, tu va ke go phu hop khong gian song.',
  '<p>Noi that go nen duoc chon theo kich thuoc phong, tan suat su dung va tong mau cua can ho.</p><p>Voi phong nho, hay uu tien thiet ke gon, chan cao va mau go sang de khong gian thoang hon.</p>',
  'DPWOOD', 24, 1,
  'Cach chon noi that go cho can ho hien dai',
  'Goi y chon noi that go DPWOOD cho phong khach, phong an va phong ngu.',
  'noi that go, dpwood, ban go, ghe go',
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM Blogs WHERE slug = 'cach-chon-noi-that-go-cho-can-ho-hien-dai'
);
