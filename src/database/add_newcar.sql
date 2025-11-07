-- Tạo database
CREATE DATABASE MilkTeaDB;
GO
USE MilkTeaDB;
GO

-- Bảng lưu danh sách bàn/số chờ
CREATE TABLE Tables (
    TableID INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT N'Sẵn sàng' -- Trạng thái: Sẵn sàng, Đang dùng, v.v.
);

-- Insert dữ liệu mẫu
INSERT INTO Tables (TableName)
VALUES 
(N'Mang về'),
(N'B.1'), (N'B.2'), (N'B.3'), (N'B.4'), (N'B.5'),
(N'B.6'), (N'B.7'), (N'B.8'), (N'B.9'), (N'B.10'),
(N'B.11'), (N'B.12'), (N'B.13'), (N'B.14'), (N'B.15'),
(N'B.16'), (N'B.17'), (N'B.18'), (N'B.19'), (N'B.20'),
(N'B.21'), (N'B.22'), (N'B.23'), (N'B.24'), (N'B.25'),
(N'B.26'), (N'B.27'), (N'B.28'), (N'B.29');
GO 
-- =============================
-- BẢNG DANH MỤC SẢN PHẨM
-- =============================
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL
);

-- Dữ liệu mẫu
INSERT INTO Categories (CategoryName)
VALUES 
(N'Trà trái cây'),
(N'Trà sữa'),
(N'Topping');
GO

-- =============================
-- BẢNG SẢN PHẨM
-- =============================
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(200) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    CategoryID INT NOT NULL,
	ImagePath NVARCHAR(MAX) NULL,
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- Dữ liệu mẫu
INSERT INTO Products (ProductName, Price, CategoryID)
VALUES
-- Trà trái cây
(N'Trà đào', 23000, 1),
(N'Trà vải', 23000, 1),
(N'Trà ổi hồng', 23000, 1),
(N'Trà dâu', 25000, 1),
(N'Trà xoài', 27000, 1),
(N'Trà trái cây', 27000, 1),
(N'Trà mận Hà Nội', 29000, 1),

-- Trà sữa
(N'Trà sữa trân châu đường đen', 30000, 2),
(N'Trà sữa matcha', 32000, 2),
(N'Trà sữa socola', 30000, 2),
(N'Trà sữa thái xanh', 28000, 2),
(N'Trà sữa truyền thống', 27000, 2),

-- Topping
(N'Trân châu đen', 5000, 3),
(N'Trân châu trắng', 5000, 3),
(N'Thạch trái cây', 7000, 3),
(N'Kem cheese', 8000, 3);
GO 
-- =============================
-- BẢNG ORDERS (ĐƠN HÀNG)
-- =============================
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    TableID INT NOT NULL, -- Bàn nào đang order
    OrderDate DATETIME DEFAULT GETDATE(),
    Total DECIMAL(10,2) DEFAULT 0, -- Tổng tiền
    Status NVARCHAR(20) DEFAULT N'Chưa thanh toán', -- Trạng thái đơn hàng
    FOREIGN KEY (TableID) REFERENCES Tables(TableID)
);
GO

-- =============================
-- BẢNG ORDER DETAILS (CHI TIẾT ĐƠN HÀNG)
-- =============================
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- =============================
-- BẢNG PAYMENT METHODS
-- =============================
CREATE TABLE PaymentMethods (
    PaymentMethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255)
);
GO

-- =============================
-- BẢNG PAYMENTS
-- =============================
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethodID INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    Note NVARCHAR(255),

    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (PaymentMethodID) REFERENCES PaymentMethods(PaymentMethodID)
);
GO

INSERT INTO PaymentMethods (MethodName, Description) VALUES
(N'Tiền mặt', N'Thanh toán trực tiếp bằng tiền mặt'),
(N'Momo', N'Thanh toán qua ví Momo'),
(N'ZaloPay', N'Thanh toán qua ví ZaloPay'),
(N'Chuyển khoản', N'Thanh toán qua ngân hàng');

CREATE TABLE MoMoTransactions (
    MoMoTransID BIGINT IDENTITY(1,1) PRIMARY KEY,
    PaymentID INT NOT NULL,
    OrderID INT NOT NULL,
    RequestId NVARCHAR(100) NOT NULL,
    OrderInfo NVARCHAR(255),
    Amount DECIMAL(18,2),
    PayUrl NVARCHAR(MAX),
    QrCodeUrl NVARCHAR(MAX),
    ResultCode INT DEFAULT 0, -- 0 = success, khác 0 = lỗi
    Message NVARCHAR(255),
    Status NVARCHAR(20) DEFAULT N'PENDING', -- PENDING, SUCCESS, FAILED
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,

    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
GO


SELECT * fROM  Tables 
SELECT * fROM  Categories 
SELECT * fROM  Products 
SELECT * fROM  OrderDetails 
SELECT * fROM  Orders
SELECT * fROM  PaymentMethods
SELECT * fROM  Payments
