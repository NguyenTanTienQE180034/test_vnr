(function () {
  const App = (window.App = window.App || {});

  App.questionsData = [
    {
      question: "Hiệp định Geneva được ký vào năm nào?",
      answers: ["1954", "1956", "1960", "1965"],
      correctIndex: 0,
      explanation: "Hiệp định Geneva về Đông Dương được ký tháng 7/1954, tạm thời chia cắt Việt Nam ở vĩ tuyến 17.",
    },
    {
      question: "Sau 1954, miền Bắc có vai trò chủ yếu nào?",
      answers: ["Hậu phương lớn cho cả nước", "Trung lập hoàn toàn", "Chỉ phát triển văn hóa", "Không tham gia chi viện"],
      correctIndex: 0,
      explanation: "Miền Bắc vừa xây dựng CNXH vừa làm hậu phương lớn chi viện cho miền Nam.",
    },
    {
      question: "Nghị quyết 15 của Đảng (1959) nhấn mạnh điều gì?",
      answers: ["Kết hợp đấu tranh chính trị với vũ trang ở miền Nam", "Ngừng mọi đấu tranh", "Chỉ đấu tranh ngoại giao", "Rút lực lượng về miền Bắc"],
      correctIndex: 0,
      explanation: "Nghị quyết 15 mở đường cho phong trào cách mạng miền Nam chuyển biến mạnh.",
    },
    {
      question: "Phong trào Đồng Khởi bùng nổ mạnh từ địa phương nào?",
      answers: ["Bến Tre", "Huế", "Hải Phòng", "Đà Lạt"],
      correctIndex: 0,
      explanation: "Đồng Khởi 1959-1960 bùng nổ mạnh ở Bến Tre, sau đó lan rộng ra Nam Bộ.",
    },
    {
      question: "Mặt trận Dân tộc Giải phóng miền Nam Việt Nam thành lập năm nào?",
      answers: ["1960", "1954", "1963", "1968"],
      correctIndex: 0,
      explanation: "Mặt trận được thành lập ngày 20/12/1960 tại miền Nam.",
    },
    {
      question: "Chiến lược " + '"Chiến tranh đặc biệt"' + " của Mỹ ở miền Nam chủ yếu dựa vào lực lượng nào?",
      answers: ["Quân đội Sài Gòn có cố vấn Mỹ", "Quân viễn chinh Mỹ trực tiếp là chính", "Liên quân Liên Hợp Quốc", "Chỉ lực lượng cảnh sát địa phương"],
      correctIndex: 0,
      explanation: "Giai đoạn Chiến tranh đặc biệt (1961-1965) dùng quân đội Sài Gòn là lực lượng chủ yếu, Mỹ chỉ huy và trang bị.",
    },
    {
      question: "Đường mòn Hồ Chí Minh trên bộ có ý nghĩa gì?",
      answers: ["Tuyến chi viện chiến lược Bắc - Nam", "Tuyến du lịch liên vùng", "Kênh ngoại giao", "Ranh giới quân sự"],
      correctIndex: 0,
      explanation: "Đây là tuyến vận tải chiến lược cực kỳ quan trọng cho chiến trường miền Nam.",
    },
    {
      question: "Trong giai đoạn 1954-1965, miền Nam giữ vai trò gì?",
      answers: ["Tiền tuyến lớn trực tiếp đấu tranh", "Chỉ làm kinh tế", "Trung lập vũ trang", "Không tham gia cách mạng"],
      correctIndex: 0,
      explanation: "Miền Nam là nơi diễn ra đấu tranh trực tiếp chống các chiến lược chiến tranh của đối phương.",
    },
    {
      question: "Mục tiêu tổng quát của cách mạng Việt Nam thời kỳ này là gì?",
      answers: ["Thống nhất đất nước", "Chia cắt lâu dài", "Từ bỏ độc lập", "Chỉ cải cách giáo dục"],
      correctIndex: 0,
      explanation: "Mục tiêu xuyên suốt là độc lập dân tộc và thống nhất Tổ quốc.",
    },
    {
      question: "Ấp chiến lược là biện pháp thuộc chiến lược nào?",
      answers: ["Chiến tranh đặc biệt", "Chiến tranh cục bộ", "Việt Nam hóa chiến tranh", "Trừng phạt hạn chế"],
      correctIndex: 0,
      explanation: "Ấp chiến lược là biện pháp trọng tâm trong Chiến tranh đặc biệt của Mỹ - chính quyền Sài Gòn.",
    },
    {
      question: "Yếu tố nào thể hiện sự lãnh đạo linh hoạt của Đảng?",
      answers: ["Điều chỉnh phương thức đấu tranh theo từng giai đoạn", "Giữ một cách làm cố định", "Không quan tâm thực tiễn", "Tách rời hai miền"],
      correctIndex: 0,
      explanation: "Đảng luôn điều chỉnh chủ trương phù hợp tình hình thực tiễn từng thời điểm.",
    },
    {
      question: "Sau Geneva 1954, nước ta tạm thời bị chia cắt ở vĩ tuyến nào?",
      answers: ["Vĩ tuyến 17", "Vĩ tuyến 16", "Vĩ tuyến 18", "Vĩ tuyến 20"],
      correctIndex: 0,
      explanation: "Hiệp định quy định giới tuyến quân sự tạm thời tại vĩ tuyến 17.",
    },
    {
      question: "Vai trò chi viện của miền Bắc cho miền Nam bao gồm nội dung nào?",
      answers: ["Nhân lực, vật lực, hậu cần", "Chỉ tuyên truyền", "Chỉ viện trợ tài chính quốc tế", "Không có nội dung nào"],
      correctIndex: 0,
      explanation: "Miền Bắc chi viện toàn diện: con người, vật chất, tổ chức và hậu cần chiến lược.",
    },
    {
      question: "Phong trào đấu tranh ở miền Nam đầu những năm 1960 có đặc điểm gì?",
      answers: ["Kết hợp chính trị và vũ trang", "Chỉ quân sự thuần túy", "Chỉ ngoại giao", "Ngừng đấu tranh"],
      correctIndex: 0,
      explanation: "Đấu tranh miền Nam phát triển theo hướng kết hợp nhiều hình thức.",
    },
    {
      question: "Một trong các cơ quan đầu não lãnh đạo cách mạng miền Nam là gì?",
      answers: ["Trung ương Cục miền Nam", "Hội đồng Bảo an", "NATO", "ASEAN"],
      correctIndex: 0,
      explanation: "Trung ương Cục miền Nam là cơ quan lãnh đạo quan trọng của Đảng ở chiến trường Nam Bộ.",
    },
    {
      question: "Đồng Khởi có tác động lớn nào sau đây?",
      answers: ["Làm thay đổi so sánh lực lượng ở miền Nam", "Chấm dứt hoàn toàn chiến tranh", "Tách miền Nam khỏi cách mạng", "Giảm vai trò quần chúng"],
      correctIndex: 0,
      explanation: "Đồng Khởi tạo bước ngoặt, đưa cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công.",
    },
    {
      question: "Trong xây dựng hậu phương miền Bắc, nhiệm vụ nào song hành với chi viện?",
      answers: ["Xây dựng kinh tế và quốc phòng", "Chỉ mở rộng thương mại", "Từ bỏ giáo dục", "Ngừng cải tạo xã hội"],
      correctIndex: 0,
      explanation: "Miền Bắc vừa xây dựng kinh tế, quốc phòng, vừa làm hậu phương cho tiền tuyến.",
    },
    {
      question: "Mặt trận Dân tộc Giải phóng miền Nam có ý nghĩa gì?",
      answers: ["Tập hợp lực lượng yêu nước chống đối phương", "Thay thế hoàn toàn vai trò Đảng", "Chỉ là tổ chức văn hóa", "Không có vai trò thực tiễn"],
      correctIndex: 0,
      explanation: "Mặt trận là hình thức liên minh rộng rãi, tập hợp các tầng lớp yêu nước ở miền Nam.",
    },
    {
      question: "Chiến tranh đặc biệt thất bại một phần do nguyên nhân nào?",
      answers: ["Sức đấu tranh bền bỉ của nhân dân hai miền", "Thiếu vũ khí hiện đại", "Không có cố vấn quân sự", "Không xây ấp chiến lược"],
      correctIndex: 0,
      explanation: "Sự lãnh đạo đúng đắn và sức mạnh quần chúng là nhân tố quan trọng làm phá sản chiến lược này.",
    },
    {
      question: "Bản chất chia cắt sau 1954 được xác định như thế nào?",
      answers: ["Tạm thời, không phải biên giới quốc gia", "Biên giới vĩnh viễn", "Chia thành hai quốc gia riêng", "Không có giới tuyến"],
      correctIndex: 0,
      explanation: "Giới tuyến quân sự chỉ mang tính tạm thời theo Hiệp định Geneva.",
    },
    {
      question: "Đường lối chung của Đảng trong giai đoạn này là gì?",
      answers: ["Giải phóng miền Nam, bảo vệ miền Bắc, tiến tới thống nhất", "Từ bỏ miền Nam", "Chỉ phát triển công nghiệp nhẹ", "Đóng băng đấu tranh"],
      correctIndex: 0,
      explanation: "Đường lối cách mạng hai miền có mục tiêu cuối cùng là thống nhất đất nước.",
    },
    {
      question: "Tại sao phải kết hợp sức mạnh hai miền?",
      answers: ["Vì hậu phương và tiền tuyến bổ trợ chiến lược cho nhau", "Vì miền Nam tự đủ lực", "Vì miền Bắc không có vai trò", "Chỉ để đối ngoại"],
      correctIndex: 0,
      explanation: "Sức mạnh tổng hợp hai miền tạo thế và lực chung cho cuộc đấu tranh.",
    },
    {
      question: "Một đặc điểm nổi bật của lãnh đạo Đảng giai đoạn 1954-1965 là gì?",
      answers: ["Kiên định mục tiêu, linh hoạt sách lược", "Thay đổi mục tiêu liên tục", "Không có chủ trương rõ", "Tách rời thực tiễn"],
      correctIndex: 0,
      explanation: "Đảng giữ vững mục tiêu chiến lược nhưng linh hoạt về phương pháp đấu tranh.",
    },
    {
      question: "Kết hợp đấu tranh chính trị với đấu tranh vũ trang giúp đạt hiệu quả nào?",
      answers: ["Mở rộng lực lượng và tạo thế tiến công toàn diện", "Chỉ tăng đàm phán", "Giảm vai trò quần chúng", "Làm chậm tiến trình cách mạng"],
      correctIndex: 0,
      explanation: "Sự kết hợp này tạo sức mạnh tổng hợp trên nhiều mặt trận.",
    },
  ];
})();
