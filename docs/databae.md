LAB 4 – KIỂM THỬ TÍCH HỢP DỰ ÁN SWP
Deadline: Tuần 9
I. Thông tin chung
Họ tên: 
Nguyễn Xuân Quang 	SE180572
Nguyễn Công Thức 	SE180289
Nguyễn Nghĩa Luật 	SE180628
Nguyễn Tấn Khang 	SE180776
Thái Bá Quân 		HE163724
Lớp: SE1805 
Dự án SWP: Phần mềm quản lí bán xe điện thông qua kênh đại lí
II. Task 1 – Viết Unit Test cho Backend
1. Mục tiêu & phạm vi:
Phạm vi:
Kiểm thử chức năng backend (service/controller/repository) của các module chính:
Module	Nghiệp vụ được test	Layer
Vehicle Management	Dealer xem danh sách và chi tiết sản phẩm xe	VehicleController, VehicleService, VehicleRepository
Customer Management	Lưu thông tin khách hàng, kiểm tra trùng SĐT	CustomerController, CustomerService, CustomerRepository
Dealer Order	Dealer tạo và truy vấn đơn hàng	OrderController, OrderService, OrderRepository
Inventory Allocation	Quản lý kho & phân bổ xe cho đại lý	InventoryController, InventoryService, InventoryRepository
Reporting	Báo cáo doanh số, tổng hợp đơn hàng	ReportController, ReportService
Mục tiêu:
•	Đảm bảo các module backend hoạt động đúng logic nghiệp vụ.
•	Kiểm thử cả main-flow (success) và error-flow (fail case).
•	Đạt coverage ≥ 80% toàn hệ thống.
2. Công cụ & Môi trường
Thành phần	Công cụ sử dụng
Ngôn ngữ	Java 17
Framework Backend	Spring Boot 3.x
CSDL test	Postgresql
Unit Test Framework	JUnit 5
Mocking Framework	Mockito
Coverage Tool	JaCoCo
Build Tool	Maven
IDE khuyến nghị	IntelliJ IDEA 

3. Danh sách các Test Case chính
Vehicle Management
Test Case ID	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi	Ghi chú
TC-V-01	Lấy danh sách xe hợp lệ	-	HTTP 200, trả về danh sách xe JSON	Main flow
TC-V-02	Lấy chi tiết xe hợp lệ	id = 5	HTTP 200, trả về thông tin xe	
TC-V-03	Xe không tồn tại	id = 999	HTTP 404, thông báo “Vehicle not found”	Error flow

Customer Management
Test Case ID	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi	Ghi chú
TC-C-01	Thêm khách hàng hợp lệ	name: "Nguyễn Văn A", phone: "0909123456"	HTTP 201, trả về ID khách hàng	Main flow
TC-C-02	Thêm khách hàng trùng SĐT	phone: "0909123456"	HTTP 409, lỗi “Duplicate phone number”	Error flow
TC-C-03	Lấy danh sách khách hàng	-	HTTP 200, trả về danh sách khách hàng	

Dealer Order
Test Case ID	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi	Ghi chú
TC-O-01	Tạo đơn hàng hợp lệ	dealerId=1, vehicleId=5, qty=1	HTTP 201, trả về orderId	Main flow
TC-O-02	Dữ liệu sai (quantity=0)	qty=0	HTTP 400, lỗi “Invalid quantity”	Error flow
TC-O-03	Lấy đơn hàng hợp lệ	id=10	HTTP 200, trả về đơn JSON	
TC-O-04	Đơn không tồn tại	id=999	HTTP 404, lỗi “Order not found”	Error flow
TC-O-05	Xóa đơn không có	id=888	HTTP 404, lỗi “Order not found”	Error flow

Inventory Allocation
Test Case ID	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi	Ghi chú
TC-I-01	Lấy tồn kho của dealer	dealerId=1	HTTP 200, trả về danh sách tồn kho	Main flow
TC-I-02	Phân bổ xe hợp lệ	inventoryId=10, dealerId=2	HTTP 200, cập nhật tồn kho	
TC-I-03	dealerId null	dealerId=null	HTTP 400, lỗi “Missing dealerId”	Error flow
TC-I-04	Tồn kho không đủ	qty yêu cầu > qty hiện có	HTTP 400, lỗi “Insufficient stock”	Error flow

Reporting
Test Case ID	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi	Ghi chú
TC-R-01	Báo cáo có dữ liệu	from=2025-01-01, to=2025-12-31	HTTP 200, trả về tổng doanh thu & đơn	Main flow
TC-R-02	Không có dữ liệu	from=1900-01-01, to=1900-12-31	HTTP 200, doanh thu=0, totalOrders=0	
TC-R-03	Thiếu tham số thời gian	from=null	HTTP 400, lỗi “Missing date range”	Error flow

4 Code minh họa
5. Kết quả chạy test:
Coverage đạt:	
Số lượng test:	
Pass / Fail:	
Mô tả lỗi (nếu có):	
 
III. Task 2 – Kiểm thử API theo Main Flows bằng Postman
1. Mục tiêu:
→ Xác minh các API chính hoạt động đúng (CRUD, Auth, lỗi, phân quyền).
2. Danh sách API kiểm thử:
API Name	Method	Endpoint	Mục tiêu	Trạng thái
				

3. Request mẫu:

- URL: {{baseUrl}}/appointments
- Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
- Body:
{
  "userId": 101,
  "serviceId": 5,
  "appointmentTime": "2025-07-01T10:00:00"
}
- Postman Test Script:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Response contains appointmentId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("appointmentId");
});
IV. Báo cáo tổng hợp
1. Luồng nghiệp vụ đã test:
→ Mô tả ngắn gọn từng luồng chính đã kiểm thử.
2. Kết quả tổng hợp:
Phần	Mô tả	Kết quả
Unit Test Backend		
API Test Postman		
3. Nhận xét & đánh giá:
→ Nêu rõ các trường hợp lỗi, cách fix, và kết luận.
4. Tài liệu tham khảo:

- JUnit / Mockito / Postman docs
- REST API best practices
- Link đến repo hoặc demo

