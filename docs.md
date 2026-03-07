Đây là **PROMPT TIẾNG VIỆT SIÊU CHI TIẾT** để bạn đưa cho AI khác tạo một game **giống Kingdom Rush khoảng 80%**, nhưng đã **biến tấu theo chủ đề Chính trị 1954–1965** và có thêm cơ chế **địch bắn trả lại trụ/căn cứ của mình**.

---

# PROMPT TẠO GAME GIỐNG KINGDOM RUSH 80% (CÓ ĐỊCH BẮN TRẢ)

Bạn là **Game Designer senior, Frontend Game Developer senior, Software Architect và chuyên gia HTML5 Canvas Game**.

Tôi muốn bạn **thiết kế và lập trình hoàn chỉnh một game phòng thủ chiến thuật trên trình duyệt**, phong cách **gần giống Kingdom Rush khoảng 80%**, nhưng **không sao chép y hệt asset hoặc nội dung gốc**, mà phải **tự sáng tạo gameplay, UI, tên gọi, logic và chủ đề riêng**.

Game phải được viết bằng:

- **HTML**
- **CSS**
- **JavaScript thuần**
- **Canvas API**

Game phải **chạy trực tiếp trong trình duyệt**, chỉ cần mở `index.html` là chơi được.
Không dùng engine nặng như Unity, Unreal.
Có thể dùng JS module nếu cần, nhưng ưu tiên code dễ chạy và dễ chỉnh sửa.

---

# 1. CHỦ ĐỀ GAME

Chủ đề bài thuyết trình:

**“Phân tích sự lãnh đạo của Đảng đối với cách mạng hai miền Nam – Bắc giai đoạn 1954–1965.”**

Game phải chuyển hóa nội dung này thành một trò chơi chiến thuật hấp dẫn.

Bối cảnh game:

- **Miền Bắc** đóng vai trò hậu phương lớn
- **Miền Nam** là tiền tuyến lớn
- Người chơi vào vai **bộ chỉ huy chiến lược**
- Người chơi xây dựng hệ thống phòng thủ, chi viện, tổ chức lực lượng, bảo vệ căn cứ, đẩy lùi các đợt tấn công của đối phương

Mục tiêu là vừa chơi vui, vừa giúp người học hiểu được:

- Vai trò của miền Bắc trong chi viện
- Vai trò của miền Nam trong đấu tranh cách mạng
- Sự lãnh đạo chiến lược, linh hoạt của Đảng
- Một số sự kiện, quyết sách, bước ngoặt tiêu biểu giai đoạn 1954–1965

---

# 2. ĐỊNH HƯỚNG GAMEPLAY

Hãy tạo một game theo phong cách:

**Tower Defense + Lane Defense + Tactical Upgrade + Educational Resource System**

Cảm hứng chính:

- Kingdom Rush
- Plants vs Zombies
- Defend base games
- Tactical wave defense games

Nhưng game này phải có điểm khác biệt:

### Điểm khác biệt bắt buộc

1. **Tài nguyên xây trụ và nâng cấp được lấy từ trả lời câu hỏi đúng**
2. **Có nhiều loại trụ, nhiều loại địch**
3. **Địch không chỉ chạy đến căn cứ, mà còn có thể bắn trả lại trụ hoặc căn cứ**
4. **Có boss**
5. **Có qua màn**
6. **Có chỉ số HP, damage, attack speed, range, armor, move speed**
7. **Có drag & drop đặt trụ**
8. **Có nâng cấp trụ giữa trận**
9. **Có UI rõ ràng, cảm giác như một game thật**
10. **Có hiệu ứng chiến đấu rõ ràng: đạn, nổ, số damage, thanh máu**

---

# 3. GAME LOOP CHÍNH

Gameplay loop mong muốn:

1. Vào màn chơi
2. Wave địch bắt đầu
3. Người chơi dùng tài nguyên để đặt trụ
4. Trụ tự động tấn công địch
5. Một số địch có thể bắn trả trụ hoặc căn cứ
6. Người chơi trả lời câu hỏi để nhận thêm tài nguyên
7. Dùng tài nguyên để:
    - xây thêm trụ
    - nâng cấp trụ
    - sửa căn cứ
    - mở kỹ năng đặc biệt

8. Kết thúc wave
9. Qua wave mới hoặc qua màn mới
10. Gặp boss ở các màn quan trọng

---

# 4. YÊU CẦU “GIỐNG KINGDOM RUSH 80%”

Game phải mang cảm giác tương tự Kingdom Rush ở các điểm sau:

- Có đường đi cố định cho địch
- Có các vị trí đặt trụ rõ ràng hoặc vùng cho phép đặt trụ
- Có nhiều loại trụ với vai trò khác nhau
- Có hệ thống nâng cấp trụ theo nhánh hoặc theo cấp
- Có các wave địch tăng dần độ khó
- Có boss
- Có cảm giác chiến thuật, chọn đúng trụ đúng vị trí
- Có giao diện hiện đại, trực quan
- Có hiệu ứng trận chiến liên tục

Nhưng không được sao chép nguyên bản.
Phải đổi thành hệ thống riêng phù hợp với chủ đề lịch sử - chính trị Việt Nam.

---

# 5. BẢN ĐỒ GAME

Tạo một bản đồ 2D top-down hoặc semi-top-down bằng Canvas.

Bản đồ cần có:

- đường hành quân của địch
- khu căn cứ cần bảo vệ
- các ô / node / pad có thể đặt trụ
- khu UI bên trái hoặc bên phải
- vùng hiển thị thông tin wave, máu, tài nguyên

Có thể chia bản đồ thành:

- tuyến đường tiến công chính
- khu hậu phương
- khu phòng thủ trung tâm
- căn cứ cuối cùng

---

# 6. HỆ THỐNG TÀI NGUYÊN

## 6.1. Supplies / Chi viện

Là tiền trong game.

Dùng để:

- xây trụ
- nâng cấp trụ
- sửa căn cứ
- dùng skill

## 6.2. Command Point / Điểm chỉ huy

Có thể dùng như tài nguyên phụ để mở kỹ năng mạnh.

## 6.3. HP căn cứ

Nếu địch lọt vào hoặc bắn phá thành công thì HP căn cứ giảm.

---

# 7. CƠ CHẾ QUIZ / CÂU HỎI GIÁO DỤC

Đây là hệ thống bắt buộc.

Người chơi sẽ nhận tài nguyên chủ yếu bằng cách trả lời đúng câu hỏi.

Cơ chế cụ thể:

- Trong game có nút **“Nhận chi viện”** hoặc **“Trả lời để nhận tiếp tế”**
- Khi bấm vào, hiện popup câu hỏi
- Mỗi câu có 4 đáp án
- Trả lời đúng:
    -   - tiền
    - có thể + command point

- Trả lời sai:
    - không được thưởng
    - hoặc có cooldown trước khi trả lời tiếp

Câu hỏi phải liên quan đến:

- Hiệp định Geneva 1954
- Vai trò của miền Bắc
- Vai trò của miền Nam
- Nghị quyết 15
- Phong trào Đồng Khởi
- Mặt trận Dân tộc Giải phóng miền Nam
- Chiến lược chiến tranh đặc biệt
- Vai trò lãnh đạo của Đảng trong từng giai đoạn

Cần có ít nhất **20–30 câu hỏi mẫu** trong code dưới dạng JSON hoặc array object.

Mỗi câu cần có:

- `question`
- `answers`
- `correctIndex`
- `explanation`

Sau khi trả lời, phải hiện:

- đúng / sai
- lời giải thích ngắn

---

# 8. HỆ THỐNG TRỤ

Tạo ít nhất **6 loại trụ**, mỗi loại có vai trò riêng.

## 8.1. Trụ Bộ Binh

- giá rẻ
- damage trung bình
- tốc độ bắn trung bình
- tầm bắn trung bình
- phù hợp đầu game

## 8.2. Trụ Súng Máy

- tốc độ bắn nhanh
- damage mỗi viên thấp
- hiệu quả với lính thường

## 8.3. Trụ Pháo

- bắn chậm
- damage lớn
- gây sát thương diện rộng
- mạnh với xe tăng / nhóm đông

## 8.4. Trụ Tên Lửa

- bắn xa
- damage rất cao
- cooldown lâu
- có hiệu ứng nổ

## 8.5. Trụ Hỗ Trợ / Chỉ Huy

- không gây damage lớn
- buff trụ xung quanh:
    - tăng damage
    - tăng tốc độ bắn
    - tăng range

## 8.6. Trụ Chặn / Công Sự

- HP cao
- dùng để hút sát thương hoặc cản nhịp tấn công
- một số địch sẽ ưu tiên bắn vào công sự này

---

# 9. NÂNG CẤP TRỤ

Mỗi trụ phải có:

- cấp 1
- cấp 2
- cấp 3

Khi nâng cấp, chỉ số tăng:

- damage
- attack speed
- range
- projectile speed
- splash radius (nếu có)

Ngoài ra, nên có **nâng cấp đặc biệt** cho trụ cấp cao, ví dụ:

- Súng máy: bắn xuyên
- Pháo: nổ lan
- Tên lửa: bắn nhiều mục tiêu
- Chỉ huy: buff diện rộng hơn

Người chơi có thể click vào trụ để mở panel nâng cấp.

Panel này hiển thị:

- tên trụ
- level
- damage
- attack speed
- range
- nút nâng cấp
- nút bán trụ

---

# 10. ĐỊCH PHẢI ĐA DẠNG

Tạo ít nhất **8 loại enemy**.

## 10.1. Lính thường

- HP thấp
- di chuyển bình thường
- không bắn xa

## 10.2. Lính xung kích

- di chuyển nhanh
- HP thấp
- áp lực đầu trận

## 10.3. Lính bọc thép

- armor cao
- giảm damage nhận vào

## 10.4. Lính bắn xa

- có thể dừng lại và bắn vào trụ gần nhất hoặc căn cứ
- là loại bắt buộc phải có

## 10.5. Chỉ huy địch

- buff quân địch xung quanh
- có aura tăng tốc / tăng damage

## 10.6. Xe cơ giới

- HP cao
- đi chậm
- có thể gây sát thương lớn lên căn cứ

## 10.7. Xe tăng

- HP rất cao
- armor cao
- có pháo bắn vào trụ
- là loại nguy hiểm

## 10.8. Boss

- HP cực cao
- có nhiều phase hoặc nhiều kỹ năng
- ví dụ:
    - tăng tốc
    - gọi thêm lính
    - bắn phá diện rộng
    - miễn nhiễm ngắn hạn
    - gây choáng trụ gần đó

---

# 11. CƠ CHẾ “ĐỊCH BẮN TRẢ LẠI”

Đây là yêu cầu rất quan trọng.

Không phải toàn bộ địch đều chỉ chạy thẳng.

Phải có một số loại địch có khả năng phản công:

## Hành vi phản công

- Khi vào trong tầm bắn, địch có thể:
    - bắn vào trụ gần nhất
    - bắn vào công sự
    - bắn vào căn cứ nếu không có trụ trong tầm

- Có cooldown bắn riêng
- Có projectile riêng
- Có animation riêng
- Trụ có HP, nên có thể bị phá hủy

## Ưu tiên mục tiêu

Có thể cấu hình AI địch:

1. ưu tiên công sự
2. nếu không có công sự → bắn trụ gần nhất
3. nếu không có trụ phù hợp → tiếp tục tiến lên căn cứ

## Loại địch có bắn trả

Ít nhất các loại sau phải bắn trả:

- lính bắn xa
- xe tăng
- boss

---

# 12. TRỤ CÓ HP VÀ CÓ THỂ BỊ PHÁ HỦY

Khác với tower defense quá đơn giản, ở game này:

- trụ phải có **HP**
- địch bắn vào trụ làm trụ mất máu
- khi HP = 0 → trụ nổ và biến mất
- người chơi phải xây lại hoặc sửa chữa

Có thể thêm nút:

- Repair tower
- Sell tower

---

# 13. CĂN CỨ CHÍNH

Người chơi có một căn cứ chính.

Căn cứ có:

- HP
- giáp (nếu muốn)
- khả năng nâng cấp

Nếu HP = 0 → thua game.

Có thể thêm hệ thống nâng cấp căn cứ:

- tăng HP tối đa
- hồi máu
- tăng thu nhập từ câu hỏi đúng

---

# 14. WAVE SYSTEM

Game phải có wave rõ ràng.

Mỗi màn có nhiều wave.

Ví dụ:

### Màn 1

- Wave 1: lính thường
- Wave 2: lính thường + lính xung kích
- Wave 3: lính thường + lính bắn xa
- Wave 4: xe cơ giới nhỏ
- Wave 5: mini boss

### Màn 2

- số lượng tăng
- xuất hiện địch bọc thép
- xuất hiện chỉ huy địch

### Màn 3

- xuất hiện xe tăng
- boss chính

Wave phải có:

- chuẩn bị trước wave
- hiển thị số wave
- nút gọi wave sớm
- thưởng nếu gọi sớm

---

# 15. BOSS DESIGN

Boss không được chỉ là enemy máu trâu.

Boss phải có cá tính chiến đấu.

Ví dụ boss có thể:

- bắn phá trụ xa
- triệu hồi lính thường mỗi 10 giây
- tăng tốc khi còn dưới 50% HP
- có giáp cao
- gây sát thương splash
- tạo vùng làm trụ bắn chậm

Boss phải có:

- thanh máu lớn riêng trên UI
- hiệu ứng xuất hiện
- âm báo hoặc visual cảnh báo

---

# 16. KỸ NĂNG ĐẶC BIỆT CỦA NGƯỜI CHƠI

Thêm 2–4 kỹ năng để game giống Kingdom Rush hơn.

Ví dụ:

## 16.1. Chi viện hỏa lực

- gây damage vùng

## 16.2. Tăng viện khẩn cấp

- hồi một ít HP căn cứ hoặc trụ

## 16.3. Tăng sĩ khí

- tăng attack speed toàn map trong vài giây

## 16.4. Pháo kích

- ném bom xuống khu vực chọn

Các skill có:

- cooldown
- nút bấm
- hiệu ứng trực quan

---

# 17. DRAG & DROP

Người chơi phải có thể **kéo thả trụ**.

Yêu cầu:

- kéo icon trụ từ panel
- thả vào vị trí hợp lệ trên map
- nếu đủ tiền thì xây
- nếu không đủ tiền thì báo đỏ / không cho đặt
- nếu thả sai chỗ thì không xây

Có thể dùng:

- mouse events
- drag simulation custom bằng canvas

---

# 18. UI / UX

UI phải đẹp, rõ, cảm giác game thật.

Phải có:

## Thanh trên cùng

- HP căn cứ
- Supplies
- Command Points
- Wave hiện tại
- Level hiện tại
- nút pause

## Panel xây trụ

- icon từng loại trụ
- giá tiền
- mô tả ngắn

## Panel thông tin trụ

Khi click vào trụ:

- tên
- cấp
- HP
- damage
- range
- tốc độ bắn
- nâng cấp
- bán
- sửa chữa

## Popup câu hỏi

- câu hỏi
- 4 đáp án
- nút chọn
- phản hồi đúng/sai
- explanation

## Màn hình game over / victory

- thống kê
- số câu trả lời đúng
- số trụ đã xây
- số địch tiêu diệt
- thời gian chơi
- nút chơi lại

---

# 19. HIỆU ỨNG HÌNH ẢNH

Game phải có hiệu ứng đủ để trông sống động:

- projectile bay
- muzzle flash
- explosion
- hit effect
- floating damage text
- thanh máu trên đầu enemy
- thanh máu trên trụ
- hiệu ứng khi boss xuất hiện
- hiệu ứng khi trụ bị phá

Không cần art cầu kỳ, có thể dùng:

- hình tròn
- hình vuông
- sprite đơn giản
- icon đơn giản

Nhưng tổng thể phải dễ nhìn và có cảm giác chiến đấu thật.

---

# 20. ÂM THANH (NẾU CÓ THỂ)

Nếu tiện, có thể thêm:

- sound bắn
- sound nổ
- sound thắng/thua
- sound click UI

Nếu không có asset âm thanh thì có thể bỏ qua, nhưng code structure nên chừa chỗ.

---

# 21. KIẾN TRÚC CODE

Tôi muốn code được tổ chức rõ ràng, không viết tất cả vào một file khổng lồ nếu không cần.

Ưu tiên cấu trúc như sau:

```text
/project
  index.html
  style.css
  js/
    main.js
    game.js
    state.js
    config.js
    map.js
    entities/
      enemy.js
      tower.js
      projectile.js
      base.js
      effects.js
    systems/
      wave-system.js
      collision-system.js
      combat-system.js
      quiz-system.js
      ui-system.js
      dragdrop-system.js
      skill-system.js
    data/
      towers.js
      enemies.js
      waves.js
      questions.js
```

Nếu muốn gọn hơn vẫn được, nhưng phải giữ tư duy module rõ ràng.

---

# 22. MÔ HÌNH DỮ LIỆU

Thiết kế object data rõ ràng.

## Tower model

Phải có ví dụ dạng:

- id
- type
- x
- y
- hp
- maxHp
- damage
- range
- attackSpeed
- cooldown
- level
- cost
- targetMode
- buffs

## Enemy model

- id
- type
- x
- y
- hp
- maxHp
- armor
- speed
- damage
- attackRange
- attackCooldown
- canAttackStructures
- reward
- buffs

## Projectile model

- id
- from
- to
- x
- y
- speed
- damage
- splashRadius
- type

---

# 23. CƠ CHẾ COMBAT

## Tower AI

Trụ phải:

- tự tìm mục tiêu
- ưu tiên enemy gần đích nhất hoặc gần trụ nhất
- bắn theo cooldown
- tạo projectile
- projectile va chạm gây damage

## Enemy AI

Enemy phải:

- đi theo path
- nếu là enemy có bắn trả thì:
    - kiểm tra tower trong range
    - nếu có mục tiêu thì bắn
    - nếu không có thì tiếp tục đi

- nếu đến căn cứ thì gây damage lên căn cứ

## Armor system

Có thể thêm:

- armor giảm sát thương nhận vào
- explosive damage mạnh với xe tăng
- machine gun mạnh với lính

---

# 24. CÂN BẰNG GAME

Game phải có độ khó tăng dần.

Early game:

- dễ hiểu
- ít địch
- ít tower

Mid game:

- có địch bắn xa
- có xe bọc thép
- cần nâng cấp

Late game:

- boss
- nhiều lane pressure
- phải phối hợp trụ và skill

Không để game quá dễ hoặc quá khó.

---

# 25. YÊU CẦU VỀ NỘI DUNG GIÁO DỤC

Game phải lồng ghép nội dung học tập nhưng không làm mất vui.

Các câu hỏi chỉ là công cụ để kiếm tài nguyên, không làm gián đoạn game quá khó chịu.

Nội dung giải thích sau câu hỏi cần ngắn gọn, dễ hiểu, chính xác về mặt kiến thức phổ thông / đại học cơ bản.

---

# 26. MÀN HÌNH CHÍNH

Game cần có menu chính gồm:

- nút Play
- nút Hướng dẫn
- nút Chọn màn
- nút Bắt đầu nhanh

Màn hướng dẫn phải giải thích:

- cách đặt trụ
- cách kiếm tài nguyên bằng trả lời câu hỏi
- cách nâng cấp trụ
- cách địch bắn trả
- cách thắng/thua

---

# 27. ĐIỀU KIỆN THẮNG / THUA

## Thắng

- sống sót qua toàn bộ wave
- tiêu diệt boss cuối màn

## Thua

- HP căn cứ về 0

---

# 28. CHẤT LƯỢNG CODE

Yêu cầu code:

- sạch
- dễ đọc
- có comment ở phần quan trọng
- không bug logic cơ bản
- không để nút bấm giả
- mọi nút phải hoạt động thật
- tower đặt được thật
- tower bắn thật
- địch di chuyển thật
- địch bắn trả thật
- wave hoạt động thật
- quiz hoạt động thật

---

# 29. OUTPUT TÔI MUỐN NHẬN

Hãy xuất ra đầy đủ:

1. `index.html`
2. `style.css`
3. `game.js` hoặc bộ file JS tách module
4. dữ liệu câu hỏi mẫu
5. dữ liệu tower
6. dữ liệu enemy
7. dữ liệu wave

Code phải chạy được ngay.

---

# 30. ƯU TIÊN QUAN TRỌNG

Ưu tiên số 1:

- game phải chơi được thật

Ưu tiên số 2:

- cảm giác giống Kingdom Rush khoảng 80%

Ưu tiên số 3:

- có địch bắn trả vào trụ/căn cứ

Ưu tiên số 4:

- có tính giáo dục

Ưu tiên số 5:

- giao diện đẹp và rõ

---

# 31. BẮT BUỘC PHẢI CÓ

Những thứ sau đây bắt buộc phải hoạt động:

- đặt trụ bằng kéo thả
- trụ tự động bắn
- địch đi theo đường
- địch bắn trả
- trụ có HP
- tower bị phá hủy được
- nâng cấp trụ
- popup câu hỏi nhận tiền
- wave system
- boss
- thắng / thua / qua màn

---

# 32. CÁCH TRIỂN KHAI

Hãy làm theo quy trình sau:

## Bước 1

Phân tích yêu cầu game và mô tả kiến trúc ngắn gọn

## Bước 2

Tạo cấu trúc file

## Bước 3

Viết toàn bộ code hoàn chỉnh

## Bước 4

Đảm bảo code có thể chạy ngay

## Bước 5

Nếu cần, thêm ghi chú cách mở game

---

# 33. YÊU CẦU CUỐI CÙNG

Tôi không muốn bạn chỉ đưa mô tả ý tưởng.
Tôi muốn bạn **code ra một game playable prototype hoàn chỉnh**.

Game phải có:

- gameplay thật
- địch phản công thật
- tower defense đúng nghĩa
- nhiều loại trụ
- nhiều loại địch
- boss
- hệ thống câu hỏi đổi lấy tài nguyên
- giao diện trực quan
- chạy trực tiếp trên browser

4. ĐỘ KHÓ (CỰC KỲ QUAN TRỌNG)

Game phải có difficulty scaling theo cấp số nhân.

Mục tiêu thiết kế:

người chơi bình thường không thể đến màn cuối

chỉ người chơi cực giỏi mới có thể thắng

Công thức scaling:

enemyHP = baseHP _ (1.35 ^ wave)
enemyDamage = baseDamage _ (1.25 ^ wave)
enemyArmor = baseArmor + floor(wave / 5)
enemySpeed = baseSpeed _ (1 + wave _ 0.02)
enemySpawnCount = baseCount + wave \* 2

Boss scaling:

bossHP = baseBossHP _ (1.6 ^ bossLevel)
bossDamage = baseBossDamage _ (1.4 ^ bossLevel) 5. BẢN ĐỒ

Map dạng top-down 2D strategy map.

Phải có:

đường path cho enemy

tower slots

base

UI area

spawn point

6. HỆ THỐNG TÀI NGUYÊN

Resource:

Supplies

Dùng để:

build tower

upgrade tower

Command Point

Dùng cho skill.

Base HP

Nếu = 0 → game over.

7. QUIZ SYSTEM

Người chơi có thể nhận tài nguyên bằng cách:

trả lời câu hỏi lịch sử

Trả lời đúng:

reward = 80 + (wave \* 20)

Sai:

reward = 0
cooldown quiz = 10s

Câu hỏi phải lưu dạng JSON.

8. TOWER SYSTEM

Mỗi tower phải có các stat:

HP
Damage
AttackSpeed
Range
Armor
ProjectileSpeed
Cost
UpgradeCost 9. CÔNG THỨC COMBAT
Damage calculation
realDamage = damage \* (100 / (100 + armor))

Ví dụ:

damage = 100
armor = 50

realDamage = 100 \* (100 / 150)
Attack speed
attacksPerSecond = attackSpeed
cooldown = 1 / attacksPerSecond
Critical hit (optional)
critChance = 10%
critMultiplier = 1.8 10. TOWER TYPES

Phải có ít nhất 6 tower.

Infantry Tower
damage: 25
range: medium
attackSpeed: 1.2
hp: 400
cost: 80
Machine Gun Tower
damage: 10
attackSpeed: 5
range: medium
hp: 300
cost: 120
Cannon Tower
damage: 120
attackSpeed: 0.6
splashRadius: 80
range: long
cost: 200
Missile Tower
damage: 250
attackSpeed: 0.4
range: very long
cost: 350
Command Tower

Buff nearby towers.

Buff:

+15% damage
+20% attack speed
Barricade Tower
hp: 2000
damage: 0
role: tank
cost: 150 11. TOWER UPGRADE

3 level upgrade.

Scaling:

level2 damage = damage _ 1.6
level3 damage = damage _ 2.5

Range scaling:

+15% mỗi level

Attack speed scaling:

+20% mỗi level 12. ENEMY TYPES

Phải có ít nhất 10 loại enemy.

Basic Soldier
hp: 120
damage: 10
speed: 1
armor: 0
Fast Scout
hp: 70
speed: 2
Armored Infantry
hp: 220
armor: 25
Sniper Enemy

Có thể bắn trụ.

range: 200
damage: 35
Heavy Gunner
hp: 400
damage: 40
attack tower
Commander

Buff enemy:

+20% speed
+20% damage
APC Vehicle
hp: 800
armor: 40
Tank
hp: 2000
damage: 120
armor: 60
attack tower
Rocket Vehicle
splash attack
Boss

Boss phải có:

nhiều phase

skill

Ví dụ:

Phase 1:

spawn soldiers

Phase 2:

missile attack

Phase 3:

rage mode

13. ENEMY ATTACKING TOWERS

Enemy AI:

if tower in range
stop
attack tower
else
continue moving

Priority:

barricade > tower > base 14. PROJECTILE SYSTEM

Projectile phải có:

speed
damage
target
type

Types:

bullet

shell

missile

laser

15. WAVE SYSTEM

Wave scaling:

enemyCount = base + wave \* 3
enemyTier = floor(wave / 5)

Every 5 waves:

mini boss

Every 10 waves:

boss 16. BOSS MECHANICS

Boss abilities:

summon enemies

shockwave

armor mode

rapid attack

Boss phải có:

giant health bar
screen shake
intro animation 17. SKILL SYSTEM

Player skills:

Artillery Strike
damage: 400
cooldown: 25s
Emergency Repair
heal towers
Morale Boost
+40% attack speed
duration 6s 18. UI (INDIE POLISHED)

UI phải trông giống game indie polished.

Phong cách:

dark strategy UI

glowing buttons

minimalistic icons

clean fonts

Elements:

Top bar:

HP
Supplies
Wave
Enemies left

Side panel:

tower icons
cost
description

Popup:

quiz
tower upgrade
game over
victory
