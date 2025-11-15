LAB 4 – KIỂM THỬ TÍCH HỢP DỰ ÁN SWP
Deadline: Tuần 9
________________________________________
Tổng quan mục tiêu
Sinh viên sẽ CHỌN 2 TRONG 4 TASK để thực hiện kiểm thử tích hợp toàn diện dự án SWP, bao gồm:
1.	Viết Test Case luồng chính trên JIRA.
2.	Viết Unit Test cho Backend dựa trên các luồng nghiệp vụ chính.
3.	Viết Unit Test cho Frontend dựa trên các luồng nghiệp vụ chính.
4.	Thực hiện Kiểm thử API theo các Main Flows bằng Postman.
 Tổng hợp báo cáo kết quả kiểm thử và viết document hướng dẫn chạy testcase cho frontend/backend.
________________________________________
1. Viết Test Case trên JIRA
•	Tạo hoặc sử dụng project JIRA của nhóm/cá nhân.
•	Viết test case chi tiết cho các luồng nghiệp vụ chính trong đề tài SWP.
•	Mỗi test case cần gồm: mục tiêu, điều kiện, dữ liệu, bước thực hiện, kết quả mong đợi, status code nếu test API.
•	Nếu đề tài có nhiều luồng, xuất toàn bộ test case và nộp kèm.
•	Nộp: Link JIRA + file export (CSV hoặc Excel).
Ví dụ minh họa test case chi tiết (Test Case JIRA)
Trường	Nội dung
Test Case ID	TC-APPT-01
Tên Test Case	Đặt dịch vụ thành công
Mục tiêu	Đảm bảo người dùng có thể đặt dịch vụ với dữ liệu hợp lệ
Điều kiện	Người dùng đã đăng nhập với token hợp lệ và có quyền đặt dịch vụ
Dữ liệu	{ "userId": 101, "serviceId": 5, "appointmentTime": "2025-07-01T10:00:00" }
Các bước thực hiện	1. Gửi POST /appointments với dữ liệu trên.
2. Kiểm tra phản hồi trả về mã 201 Created.
3. Kiểm tra dữ liệu trả về có chứa appointmentId mới.
4. Kiểm tra trường appointmentTime đúng như yêu cầu.
Kết quả mong đợi	Phản hồi status code 201.
Dữ liệu trả về có appointmentId, userId, serviceId, appointmentTime chính xác.
Thông báo thành công.
Ghi chú	Test cần được thực hiện với token JWT hợp lệ thuộc về user có quyền đặt lịch.
________________________________________
2. Viết Unit Test Backend và Frontend
Mục đích
•	Backend: kiểm thử từng module nghiệp vụ (service, controller, repository) đảm bảo logic và xử lý dữ liệu đúng.
•	Frontend: kiểm thử component UI, state, sự kiện, xử lý API call.
Yêu cầu
•	Viết unit test cho các chức năng (main-flow) trên backend và component/hook frontend.
•	Bao gồm test thành công và test lỗi.
•	Sử dụng framework phù hợp:
o	Backend: JUnit + Mockito (Java), MSTest/NUnit + Moq (.NET), Mocha + Chai + Sinon (Node.js).
o	Frontend: Jest + React Testing Library (React), hoặc framework tương đương.
•	Đảm bảo coverage ≥ 80%.
•	Có file README hướng dẫn setup và chạy unit test.
•	Nộp: Link GitHub repo
Ví dụ minh họa
Unit Test Backend (Spring Boot, Java)
@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    @Test
    public void testCreateAppointment_Success() {
        Appointment input = new Appointment(null, 101L, 5L, LocalDateTime.of(2025,7,1,10,0));
        Appointment saved = new Appointment(1L, 101L, 5L, LocalDateTime.of(2025,7,1,10,0));

        when(appointmentRepository.save(input)).thenReturn(saved);

        Appointment result = appointmentService.createAppointment(input);

        assertNotNull(result.getId());
        assertEquals(101L, result.getUserId());
        assertEquals(5L, result.getServiceId());
    }

    @Test
    public void testCreateAppointment_InvalidTime_ThrowsException() {
        Appointment input = new Appointment(null, 101L, 5L, LocalDateTime.of(2020,1,1,10,0)); // quá khứ

        Exception ex = assertThrows(InvalidDataException.class, () -> {
            appointmentService.createAppointment(input);
        });

        assertEquals("Appointment time must be in the future", ex.getMessage());
    }
}
Unit Test Frontend (React + Jest)
Ví dụ chi tiết về Unit Test Frontend cho chức năng Đăng ký dịch vụ trong React, phân chia rõ ràng kiểm thử từng phần (Dùng Jest và React Testing Library):
- UI rendering
- State
- Sự kiện
- Xử lý API call. 
________________________________________
Giả sử Component ServiceRegistrationForm.jsx

import React, { useState } from 'react';
import { registerService } from '../api/serviceApi';

export default function ServiceRegistrationForm() {
  const [serviceName, setServiceName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    setError('');
    try {
      await registerService({ name: serviceName });
      setSubmitted(true);
    } catch {
      setError('Failed to register service');
    }
  };

  if (submitted) {
    return <div>Service registered successfully!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="serviceName">Service Name</label>
      <input
        id="serviceName"
        value={serviceName}
        onChange={e => setServiceName(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Register</button>
    </form>
  );
}
________________________________________
Unit Test chi tiết cho từng phần
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceRegistrationForm from './ServiceRegistrationForm';

// Mock API call
jest.mock('../api/serviceApi', () => ({
  registerService: jest.fn(),
}));

import { registerService } from '../api/serviceApi';

describe('ServiceRegistrationForm', () => {

  // 1. Test UI rendering ban đầu
  test('renders form input and button', () => {
    render(<ServiceRegistrationForm />);
    expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  // 2. Test state: nhập input cập nhật đúng state
  test('updates input value on change', () => {
    render(<ServiceRegistrationForm />);
    const input = screen.getByLabelText(/service name/i);
    fireEvent.change(input, { target: { value: 'Test Service' } });
    expect(input.value).toBe('Test Service');
  });

  // 3. Test sự kiện submit với dữ liệu hợp lệ và API thành công
  test('submits form successfully', async () => {
    registerService.mockResolvedValueOnce({ success: true });

    render(<ServiceRegistrationForm />);
    fireEvent.change(screen.getByLabelText(/service name/i), { target: { value: 'Test Service' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(registerService).toHaveBeenCalledWith({ name: 'Test Service' });
      expect(screen.getByText(/service registered successfully/i)).toBeInTheDocument();
    });
  });

  // 4. Test sự kiện submit với dữ liệu không hợp lệ (bỏ trống input)
  test('shows validation error if service name is empty', () => {
    render(<ServiceRegistrationForm />);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Service name is required');
    expect(registerService).not.toHaveBeenCalled();
  });

  // 5. Test sự kiện submit khi API trả lỗi
  test('shows error message when API call fails', async () => {
    registerService.mockRejectedValueOnce(new Error('API error'));

    render(<ServiceRegistrationForm />);
    fireEvent.change(screen.getByLabelText(/service name/i), { target: { value: 'Test Service' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to register service');
    });
  });

});
________________________________________
Giải thích
Mục kiểm thử	Mục tiêu	Cách thực hiện trong test
UI rendering	Đảm bảo form input, button hiển thị đúng	Kiểm tra presence của các element với getByLabelText, getByRole
State update	Input value thay đổi khi người dùng nhập	Dùng fireEvent.change và kiểm tra input.value
Submit thành công	Gửi API đúng dữ liệu và hiển thị thành công	Mock API trả về thành công, kiểm tra callback gọi, kiểm tra message hiển thị
Submit không hợp lệ	Bỏ trống input, hiển thị cảnh báo, không gọi API	Click submit khi input rỗng, kiểm tra message lỗi và API không được gọi
Submit lỗi API	API trả lỗi, hiển thị lỗi trên UI	Mock API trả lỗi, kiểm tra message lỗi hiển thị
________________________________________
3. Kiểm thử API bằng Postman
•	Tạo Postman Collection với các request CRUD và các bước luồng nghiệp vụ chính.
•	Test cases kiểm tra authentication, authorization, success, error cases.
•	Chia sẻ qua tính năng Share > Get public link (phiên bản Postman mới).
•	Nộp kèm file .json export và link public.
Ví dụ Test API Postman (POST /appointments)
Request:
•	Method: POST
•	URL: {{baseUrl}}/appointments
•	Header: Authorization: Bearer {{token}}
•	Body (raw JSON):
{
  "userId": 101,
  "serviceId": 5,
  "appointmentTime": "2025-07-01T10:00:00"
}
Test Script:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response contains appointmentId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("appointmentId");
});
________________________________________
4. Báo cáo tổng hợp
•	Mô tả các luồng nghiệp vụ đã test.
•	Tổng hợp test case JIRA và link.
•	Báo cáo kết quả unit test, coverage.
•	Tóm tắt kết quả test API.
•	Hướng dẫn setup & chạy test.
•	File báo cáo gửi định dạng PDF/Word
________________________________________
Tiêu chí chấm điểm:
Phần	Mô tả
1. Test Case JIRA	Đầy đủ luồng chính, test case rõ ràng, logic, cover lỗi/sai
2. Unit Test Backend & Frontend	Đạt coverage ≥80%, test case đa dạng, code sạch, có hướng dẫn.
3. Kiểm thử API Postman	Bộ test API đầy đủ, check phân quyền, lỗi, link share chuẩn
4. Báo cáo tổng hợp	Rõ ràng, đầy đủ, có hướng dẫn chạy, kết quả test & nhận xét
________________________________________
Tài liệu tham khảo
•	JIRA: https://www.atlassian.com/software/jira
•	Postman: https://learning.postman.com/docs/writing-scripts/test-scripts/
•	JUnit: https://junit.org/junit5/docs/current/user-guide/
•	Mockito: https://site.mockito.org/
•	React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
•	REST API Best Practices: https://restfulapi.net/
•	.NET Unit Testing:
https://learn.microsoft.com/en-us/dotnet/core/testing/
https://nunit.org/
https://xunit.net/
•	Moq (Mocking .NET): https://github.com/moq/moq4
•	Node.js Testing:
https://mochajs.org/
https://www.chaijs.com/
https://jestjs.io/
•	Express.js Testing:
https://expressjs.com/en/advanced/best-practice-performance.html#testing

