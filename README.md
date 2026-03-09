# Chiến Tuyến 1954-1965

Prototype tower defense chạy trực tiếp trên trình duyệt bằng HTML/CSS/JavaScript + Phaser 3.

## Cách chạy
1. Mở file `index.html` bằng trình duyệt.
2. Ở menu chính chọn `Play` hoặc `Bắt đầu nhanh` để vào Endless mode.
3. Phaser runtime được nhúng local qua file `phaser.min.js` trong repo.

## Điều khiển nhanh
- Kéo thả trụ từ panel phải vào các ô tròn trên map.
- Click trụ đã xây để nâng cấp / sửa / bán.
- Trụ có 3 level theo loại; đạt Lv3 có thể dùng CP để nâng riêng DMG / HP / tốc bắn.
- Có thêm Trụ Laser Xuyên và nhiều loại địch mới.
- Mỗi trụ có icon `+` ngay trên đầu (khi còn nâng cấp được): bấm vào sẽ mở popup nâng cấp nhanh.
- Mỗi card trụ trong sidebar `Xây trụ` có nút `+` để nâng cấp **global theo loại trụ** (không cần đặt trước).
- Bấm `Nhận chi viện` để mở quiz lấy Supplies.
- Dùng kỹ năng ở panel phải (Artillery cần click mục tiêu trên map).
- `Bắt đầu wave ngay` để nhận thưởng thêm.
- Mỗi wave kéo dài 30s, luôn có boss; phải hạ boss mới sang wave tiếp theo.
- Căn cứ có 3 level, có thể tăng HP max và hồi máu (mỗi wave chỉ hồi 1 lần).
- Nút `?` góc trên mở bảng chi tiết toàn bộ trụ.

## Lưu ý
- Prototype không cần build tool.
- Có thể chơi hoàn toàn offline.
- Có anti-inspect phía client (chặn hotkey/context menu/devtools detect) để hạn chế cheat cơ bản.
