-- Add layout column to stations table to store station layout configuration
-- Run this SQL in Supabase SQL Editor

-- Add layout column as JSONB for flexible structure
ALTER TABLE stations 
ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT NULL;

-- Create index on layout column for better query performance
CREATE INDEX IF NOT EXISTS idx_stations_layout ON stations USING gin(layout);

-- Add comment to layout column
COMMENT ON COLUMN stations.layout IS 'Station layout configuration including grid dimensions, facilities, and entrances (stored as JSONB)';

-- Example layout structure:
-- {
--   "width": 6,
--   "height": 4,
--   "entrances": [
--     { "x": 3, "y": 0, "direction": "north" }
--   ],
--   "facilities": [
--     { "type": "restroom", "x": 1, "y": 1, "width": 1, "height": 1 },
--     { "type": "cafe", "x": 4, "y": 1, "width": 1, "height": 1 }
--   ]
-- }

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Layout column added to stations table successfully!';
    RAISE NOTICE '📋 Stations can now store custom layout configurations';
END $$;   CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
CREATE DATABASE BookManagementDb
GO

USE BookManagementDb
GO


CREATE TABLE BookCategory(
	BookCategoryId int PRIMARY KEY,
	BookGenreType nvarchar(50) NOT NULL,
	Description nvarchar(500) NOT NULL
)
GO

CREATE TABLE Book(
	BookId int PRIMARY KEY,
	BookName nvarchar(100) NOT NULL,
	Description nvarchar(1000) NOT NULL,
	PublicationDate datetime NOT NULL,
	Quantity int NOT NULL,
	Price float NOT NULL,
	Author nvarchar(50) NOT NULL,
	BookCategoryId int NOT NULL
)
GO

ALTER TABLE Book WITH CHECK ADD CONSTRAINT FK_Book_BookCategory FOREIGN KEY(BookCategoryId)
REFERENCES BookCategory (BookCategoryId)
GO

CREATE TABLE UserAccount(
	MemberId int PRIMARY KEY,
	Password nvarchar(50) NOT NULL,
	Email nvarchar(50) NOT NULL,
	FullName nvarchar(50) NOT NULL,
	Role int NOT NULL
)
GO

-- INSERT DATA TO BOOK CATEGORY TABLE

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (1, N'Fiction', N'Fiction is any creative work, chiefly any narrative work, portraying individuals, events, or places that are imaginary, or in ways that are imaginary.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (2, N'Science Fiction', N'Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (3, N'Historical Fiction', N'Historical fiction is a literary genre in which the plot takes place in a setting related to the past events, but is fictional.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (4, N'Finance', N'Finance is a field that deals with the study of investments. It includes the dynamics of assets and liabilities over time under conditions of different degrees of uncertainty and risk. Finance can also be defined as the science of money management. Finance aims to price assets based on their risk level and their expected rate of return.')
GO

INSERT BookCategory (BookCategoryId, BookGenreType, Description) VALUES (5, N'Self Help', N'The one that is written with the intention to instruct its readers on solving personal problems')
GO

-- INSERT DATA TO BOOK TABLE

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (15, N'Đời Ngắn Đừng Ngủ Dài-Short Life Don’t Sleep Long', N'Mọi lựa chọn đều giá trị. Mọi bước đi đều quan trọng. Cuộc sống vẫn diễn ra theo cách của nó, không phải theo cách của ta. Hãy kiên nhẫn. Tin tưởng.', CAST(N'2023-01-01T00:00:00.000' AS DateTime), 20, 5.0, N'Robin Sharma', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (16, N'Mình Là Nắng, Việc Của Mình Là Chói Chang-I Am the Sun, My Job Is to Shine Bright',  N'Đừng bỏ lỡ những ngày nắng đẹp. Đừng bỏ qua một trái tim mạnh mẽ và luôn tỏa sáng. Hãy rực rỡ theo cách của riêng mình, cho dù bạn là ai đi chăng nữa.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 4.5, N'Kazuko Watanabe', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (17, N'Tuổi Trẻ Đáng Giá Bao Nhiêu-How Much Is Youth Worth', N'''Tuổi trẻ đáng giá bao nhiêu?'' giúp giới trẻ dễ dàng tìm định hướng cho mình. Bởi vì, có những lúc bạn cần chủ động biến công việc thành niềm đam mê và tạo ra một bước ngoặt khác cho bản thân.', CAST(N'2018-01-01T00:00:00.000' AS DateTime), 20, 6, N'Rosie Nguyễn', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (1, N'The Handbook Of International Trade And Finance', N'An international trade transaction, no matter how straightforward it may seem at the start, is not completed until delivery has taken place, any other obligations have been fulfilled and the seller has received payment. This may seem obvious; however, even seemingly simple transactions can, and sometimes do, go wrong.', CAST(N'2005-01-01T00:00:00.000' AS DateTime), 10, 45.99, N'Anders Grath', 5)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (2, N'Snow Crash', N'Hiro lives in a Los Angeles where franchises line the freeway as far as the eye can see. The only relief from the sea of logos is within the autonomous city-states, where law-abiding citizens don’t dare leave their mansions.', CAST(N'2001-01-01T00:00:00.000' AS DateTime), 20, 12.99, N'Neal Stephenson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (3, N'Contact: A Novel', N'The future is here…in an adventure of cosmic dimension. When a signal is discovered that seems to come from far beyond our solar system, a multinational team of scientists decides to find the source. What follows is an eye-opening journey out to the stars to the most awesome encounter in human history. Who—or what—is out there? Why are they watching us? And what do they want with us?', CAST(N'2019-02-26T00:00:00.000' AS DateTime), 15, 12.99, N'Carl Sagan', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (4, N'The Time Machine', N'The story follows a Victorian scientist, who claims that he has invented a device that enables him to travel through time, and has visited the future, arriving in the year 802,701 in what had once been London.', CAST(N'2021-06-29T00:00:00.000' AS DateTime), 11, 6.99, N'H.G. Wells', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (5, N'Rosewater (The Wormwood Trilogy, 1)', N'Rosewater is a town on the edge. A community formed around the edges of a mysterious alien biodome, its residents comprise the hopeful, the hungry, and the helpless -- people eager for a glimpse inside the dome or a taste of its rumored healing powers.', CAST(N'2018-09-18T00:00:00.000' AS DateTime), 27, 10.49, N'Tade Thompson', 2)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (6, N'The Last Russian Doll', N'A haunting, epic novel about betrayal, revenge, and redemption that follows three generations of Russian women, from the 1917 revolution to the last days of the Soviet Union, and the enduring love story at the center.
', CAST(N'2023-03-14T00:00:00.000' AS DateTime), 21, 19.99, N'Kristen Loesch', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (7, N'The Whip: a novel inspired by the story of Charley Parkhurst', N'The Whip is inspired by the true story of a woman, Charlotte "Charley" Parkhurst (1812-1879) who lived most of her extraordinary life as a man in the old west. As a young woman in Rhode Island, she fell in love with a runaway slave and had his child. The destruction of her family drove her west to California, dressed as a man, to track the killer.
', CAST(N'2011-12-31T00:00:00.000' AS DateTime), 5, 20.71, N'Karen Kondazian', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (8, N'Where the Lost Wander: A Novel', N'In this epic and haunting love story set on the Oregon Trail, a family and their unlikely protector find their way through peril, uncertainty, and loss.', CAST(N'2020-04-28T00:00:00.000' AS DateTime), 12, 8.28, N'Amy Harmon', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (9, N'All the Light We Cannot See: A Novel', N'Winner of the Pulitzer Prize* A New York Times Book Review Top Ten Book* A National Book Award Finalist', CAST(N'2017-04-04T00:00:00.000' AS DateTime), 30, 16.43, N'Anthony Doerr', 3)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (10, N'Dave Ramsey''s Complete Guide To Money', N'Dave Ramsey’s Complete Guide to Money offers the ultra-practical way to learn how money works.', CAST(N'2012-01-01T00:00:00.000' AS DateTime), 7, 12.09, N'Dave Ramsey', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (11, N'How to Manage Your Money When You Don''t Have Any', N'Unlike many personal finance books, How to Manage Your Money When You Don''t Have Any was specifically written for Americans who struggle to make it on a monthly basis. It provides a respectful, no-nonsense look at the difficult realities of our modern economy, along with an easy to follow path toward better financial stability that will give hope to even the most financially strapped households. Created by a financial expert who hasn''t struck it rich, How to Manage Your Money When You Don''t Have Any offers a first hand..', CAST(N'2012-06-07T00:00:00.000' AS DateTime), 3, 11.99, N'Mr Erik Wecks', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (12, N'Clever Girl Finance: Ditch debt, save money and build real wealth', N'Join the ranks of thousands of smart and savvy women who have turned to money expert and author Bola Sokunbi for guidance on ditching debt, saving money, and building real wealth.', CAST(N'2019-06-25T00:00:00.000' AS DateTime), 17, 14.99, N'Bola Sokunbi', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (13, N'Growing Money', N'Colin and Devon are cousins who share the same birthday. On their eighth birthday, their grandpa gifts them two envelopes of money to do anything they like with it.', CAST(N'2023-06-13T00:00:00.000' AS DateTime), 29, 11.99, N'Brandon L Parker', 4)
GO

INSERT Book (BookId, BookName, Description, PublicationDate, Quantity, Price, Author, BookCategoryId) VALUES (14, N'Clever Girl Finance: Learn How Investing Works, Grow Your Money', N'Clever Girl Finance: Learn How Investing Works, Grow Your Money is the leading guide for women who seek to learn the basic foundations of personal investing. In a no-nonsense and straightforward style, this book teaches readers.', CAST(N'2020-10-02T00:00:00.000' AS DateTime), 19, 13.6, N'Bola Sokunbi', 4)
GO

-- INSERT DATA TO USER ACCOUNT TABLE

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (1, N'@123Ad', N'admin@bookstore.com', N'Administrator', 1)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (2, N'@123St', N'staff@bookstore.com', N'Staff', 2)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (3, N'@123Mb1', N'member1@bookstore.com', N'Member 1', 3)
GO

INSERT UserAccount (MemberId, Password, Email, FullName, Role) VALUES (4, N'@123Mb2', N'member2@bookstore.com', N'Member 2', 3)
GO
s