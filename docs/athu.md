FORM THỰC HIỆN KIỂM THỬ TÍCH HỢP SWP
1. FORM – Viết Unit Test cho Backend
1. Thông tin chung
Tên module / chức năng:	
Ngôn ngữ / Framework:	
Công cụ kiểm thử:	
2. Mô tả nghiệp vụ được kiểm thử
Tên luồng nghiệp vụ:	
Mô tả ngắn gọn:	
3. Các Test Case chính
Test Case ID	Tên Test Case	Mục tiêu kiểm thử	Input / Mock Data	Kết quả mong đợi
				
				
				
4. Code minh họa (mẫu điền nội dung)

@ExtendWith(MockitoExtension.class)
class [YourServiceName]Test {

    @Mock
    private [YourRepository] repository;

    @InjectMocks
    private [YourService] service;

    @Test
    void testCreate_Success() {
        [Entity] input = new [Entity](null, ...);
        [Entity] saved = new [Entity](1L, ...);
        when(repository.save(input)).thenReturn(saved);
        var result = service.create(input);
        assertNotNull(result.getId());
        assertEquals(...);
    }

    @Test
    void testCreate_Invalid_ThrowsException() {
        [Entity] input = new [Entity](null, ...);
        assertThrows([Exception].class, () -> service.create(input));
    }
}

5. Kết quả chạy test
Coverage đạt (%):	
Kết quả:	
Ghi chú:	
6. Hướng dẫn chạy test

- Clone repo:
  git clone <repo-url>
- Chạy lệnh kiểm thử:
  mvn test
  hoặc
  npm run test
- Xem báo cáo coverage tại: target/site/jacoco/index.html

 
2. FORM – Kiểm thử API theo Main Flows (Postman)
1. Thông tin chung
Tên API / Module:	
Base URL:	
Công cụ:	
2. Danh sách API kiểm thử
API Name	Method	Endpoint	Mục tiêu
			
			
			
3. Request chi tiết (mẫu điền nội dung)

Test 1 – Đặt dịch vụ thành công
Method: POST
URL: {{baseUrl}}/appointments
Header:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body:
{
  "userId": 101,
  "serviceId": 5,
  "appointmentTime": "2025-07-01T10:00:00"
}
Test Script (Postman):
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Response contains appointmentId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("appointmentId");
});

4. Hướng dẫn nộp bài

- Nộp kèm:
  ✅ File .json export của Postman Collection
  ✅ Link public (Share → Get Public Link)

