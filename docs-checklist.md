# Checklist đối chiếu docs.md

## Trạng thái tổng quan
- [x] Standalone HTML/CSS/JS/Canvas, mở trực tiếp `index.html`.
- [x] Cấu trúc module tách file theo nhóm data/entities/systems.
- [x] Gameplay prototype playable end-to-end.

## Đối chiếu theo yêu cầu chính
- [x] Chủ đề lịch sử 1954-1965 tích hợp vào UI + quiz.
- [x] Tower Defense + Lane Defense + Tactical Upgrade + Quiz resource.
- [x] Có đường đi cố định, node đặt trụ, căn cứ chính, spawn point.
- [x] Có resources: Supplies, Command Points, Base HP.
- [x] Quiz popup 4 đáp án, đúng/sai + explanation, cooldown khi sai.
- [x] 24 câu hỏi mẫu JSON object (`question/answers/correctIndex/explanation`).
- [x] 6 loại trụ: Infantry, Machine Gun, Cannon, Missile, Command, Barricade.
- [x] Trụ có HP/armor, có thể bị phá hủy, có repair/sell.
- [x] Nâng cấp trụ Lv1-3, scale damage/range/attack speed/projectile/splash.
- [x] Có special upgrade ở lv cao (xuyên, nổ lan, đa mục tiêu, aura rộng).
- [x] 10+ loại enemy (bao gồm boss), có sniper/tank/boss bắn trả.
- [x] Enemy AI ưu tiên mục tiêu: barricade > tower > base.
- [x] Projectile system có bullet/shell/missile/laser.
- [x] Armor formula combat: `damage * (100/(100+armor))`.
- [x] Có crit tùy chọn 10% x1.8.
- [x] Wave system rõ ràng, prep trước wave, gọi sớm có thưởng.
- [x] Campaign 3 màn, mỗi màn 10 wave; wave 5 mini boss, wave 10 boss.
- [x] Difficulty scaling hàm mũ cho HP/damage/armor/speed theo wave.
- [x] Boss có phase + skill (summon, missile, shockwave, armor mode, rage).
- [x] UI đầy đủ: top bar, panel trụ/skill, tower detail panel, popup quiz.
- [x] Menu chính: Play/Hướng dẫn/Chọn màn/Bắt đầu nhanh.
- [x] Điều kiện thắng-thua, màn qua-level và thống kê cuối trận.
- [x] Hiệu ứng chiến đấu: projectile, muzzle, nổ, hit, damage text, HP bars, boss warning, shake.
- [x] Âm thanh: có audio-system placeholder để cắm asset sau (không chặn playable).

## Output files
- [x] `index.html`
- [x] `style.css`
- [x] Bộ JS module trong `js/`
- [x] Data tower/enemy/wave/questions tách riêng

## Kiểm tra kỹ thuật
- [x] Toàn bộ file JS pass `node --check`.
