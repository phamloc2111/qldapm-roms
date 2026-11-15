-- Vietnamese restaurant sample catalog. Prices are illustrative, in VND.
-- Preserve existing records, including inactive ones, when names match.
INSERT INTO categories (id, name, active)
SELECT CAST(seed.id AS UUID), seed.name, TRUE
FROM (VALUES
    ('10000000-0000-4000-8000-000000000001', 'Khai vị'),
    ('10000000-0000-4000-8000-000000000002', 'Gỏi và salad'),
    ('10000000-0000-4000-8000-000000000003', 'Súp'),
    ('10000000-0000-4000-8000-000000000004', 'Món bò'),
    ('10000000-0000-4000-8000-000000000005', 'Món heo'),
    ('10000000-0000-4000-8000-000000000006', 'Món gà'),
    ('10000000-0000-4000-8000-000000000007', 'Món vịt'),
    ('10000000-0000-4000-8000-000000000008', 'Cá'),
    ('10000000-0000-4000-8000-000000000009', 'Tôm'),
    ('10000000-0000-4000-8000-000000000010', 'Mực'),
    ('10000000-0000-4000-8000-000000000011', 'Lẩu'),
    ('10000000-0000-4000-8000-000000000012', 'Cơm'),
    ('10000000-0000-4000-8000-000000000013', 'Mì và bún'),
    ('10000000-0000-4000-8000-000000000014', 'Rau và món chay'),
    ('10000000-0000-4000-8000-000000000015', 'Tráng miệng'),
    ('10000000-0000-4000-8000-000000000016', 'Nước ép'),
    ('10000000-0000-4000-8000-000000000017', 'Sinh tố'),
    ('10000000-0000-4000-8000-000000000018', 'Trà'),
    ('10000000-0000-4000-8000-000000000019', 'Cà phê'),
    ('10000000-0000-4000-8000-000000000020', 'Nước giải khát')
) AS seed(id, name)
WHERE NOT EXISTS (SELECT 1 FROM categories existing WHERE existing.name = seed.name);

-- Resolve categories by name so pre-existing category IDs can be reused.
INSERT INTO menu_items (id, category_id, name, description, price_vnd, is_available, is_active)
SELECT CAST(seed.id AS UUID), category.id, seed.name, seed.description, seed.price_vnd, TRUE, TRUE
FROM (VALUES
    ('20000000-0000-4000-8000-000000000001', 'Khai vị', 'Chả giò hải sản', '6 cuốn chả giò nhân tôm mực, ăn kèm rau sống và nước mắm chua ngọt.', 79000),
    ('20000000-0000-4000-8000-000000000002', 'Khai vị', 'Khoai tây chiên', 'Khoai tây chiên vàng giòn, dùng kèm tương cà và sốt mayonnaise.', 45000),
    ('20000000-0000-4000-8000-000000000003', 'Khai vị', 'Đậu hũ chiên sả', 'Đậu hũ chiên giòn bên ngoài, mềm bên trong, phủ sả băm thơm.', 49000),
    ('20000000-0000-4000-8000-000000000004', 'Gỏi và salad', 'Gỏi ngó sen tôm thịt', 'Ngó sen giòn trộn tôm, thịt heo, rau răm và đậu phộng; kèm bánh phồng tôm.', 99000),
    ('20000000-0000-4000-8000-000000000005', 'Gỏi và salad', 'Salad rau củ sốt mè rang', 'Xà lách, cà chua bi, dưa leo và bắp ngọt trộn sốt mè rang.', 69000),
    ('20000000-0000-4000-8000-000000000006', 'Gỏi và salad', 'Gỏi xoài khô mực', 'Xoài xanh bào sợi trộn khô mực nướng, rau thơm và nước mắm chua cay.', 89000),
    ('20000000-0000-4000-8000-000000000007', 'Súp', 'Súp cua trứng cút', 'Súp cua cùng nấm tuyết, bắp ngọt và trứng cút; khẩu phần 1 chén.', 39000),
    ('20000000-0000-4000-8000-000000000008', 'Súp', 'Súp gà nấm hương', 'Ức gà xé, nấm hương và bắp ngọt trong nước dùng gà; khẩu phần 1 chén.', 35000),
    ('20000000-0000-4000-8000-000000000009', 'Món bò', 'Bò lúc lắc khoai tây', 'Bò cắt khối áp chảo cùng ớt chuông, hành tây; dùng kèm khoai tây chiên.', 159000),
    ('20000000-0000-4000-8000-000000000010', 'Món bò', 'Bò xào thiên lý', 'Thịt bò mềm xào hoa thiên lý và tỏi, nêm vị vừa ăn.', 139000),
    ('20000000-0000-4000-8000-000000000011', 'Món bò', 'Bắp bò hấp gừng', 'Bắp bò thái lát hấp gừng sả, dùng kèm rau thơm và mắm gừng.', 149000),
    ('20000000-0000-4000-8000-000000000012', 'Món heo', 'Sườn non rim mắm', 'Sườn non rim nước mắm, tỏi và tiêu đến khi thấm vị.', 119000),
    ('20000000-0000-4000-8000-000000000013', 'Món heo', 'Ba chỉ nướng riềng mẻ', 'Ba chỉ heo ướp riềng mẻ nướng, ăn kèm rau sống và nước chấm.', 129000),
    ('20000000-0000-4000-8000-000000000014', 'Món heo', 'Thịt kho trứng', 'Thịt ba chỉ kho nước dừa cùng trứng vịt, dùng trong thố nhỏ.', 99000),
    ('20000000-0000-4000-8000-000000000015', 'Món gà', 'Cánh gà chiên nước mắm', '6 cánh gà chiên giòn áo sốt nước mắm tỏi.', 119000),
    ('20000000-0000-4000-8000-000000000016', 'Món gà', 'Gà nướng muối ớt', 'Nửa con gà nướng muối ớt, kèm dưa leo, rau răm và muối chanh.', 189000),
    ('20000000-0000-4000-8000-000000000017', 'Món gà', 'Gà hấp lá chanh', 'Nửa con gà hấp lá chanh, chặt miếng, dùng kèm muối tiêu chanh.', 179000),
    ('20000000-0000-4000-8000-000000000018', 'Món vịt', 'Vịt quay ngũ vị', 'Nửa con vịt quay da vàng, ướp ngũ vị, dùng kèm nước chấm riêng.', 219000),
    ('20000000-0000-4000-8000-000000000019', 'Món vịt', 'Vịt xào sả ớt', 'Thịt vịt xào sả, ớt và hành tây, vị cay nhẹ.', 139000),
    ('20000000-0000-4000-8000-000000000020', 'Cá', 'Cá diêu hồng hấp Hồng Kông', 'Cá nguyên con khoảng 800 g hấp xì dầu, gừng và hành lá.', 229000),
    ('20000000-0000-4000-8000-000000000021', 'Cá', 'Cá lóc kho tộ', 'Cá lóc kho trong tộ đất với nước mắm, tiêu và hành.', 119000),
    ('20000000-0000-4000-8000-000000000022', 'Cá', 'Cá chẽm chiên giòn', 'Cá chẽm nguyên con khoảng 700 g chiên giòn, kèm nước mắm xoài.', 249000),
    ('20000000-0000-4000-8000-000000000023', 'Tôm', 'Tôm sú rang muối', 'Tôm sú khoảng 300 g rang muối tỏi, dùng kèm rau trang trí.', 179000),
    ('20000000-0000-4000-8000-000000000024', 'Tôm', 'Tôm hấp nước dừa', 'Tôm sú khoảng 300 g hấp nước dừa tươi, chấm muối tiêu chanh.', 169000),
    ('20000000-0000-4000-8000-000000000025', 'Mực', 'Mực chiên nước mắm', 'Mực ống khoảng 300 g chiên giòn, áo sốt nước mắm tỏi.', 159000),
    ('20000000-0000-4000-8000-000000000026', 'Mực', 'Mực nướng sa tế', 'Mực ống khoảng 300 g ướp sa tế nướng, kèm rau răm và dưa leo.', 169000),
    ('20000000-0000-4000-8000-000000000027', 'Lẩu', 'Lẩu Thái hải sản', 'Nước lẩu chua cay, tôm, mực, cá, nấm và rau; kèm bún, dùng cho 3–4 người.', 349000),
    ('20000000-0000-4000-8000-000000000028', 'Lẩu', 'Lẩu gà lá é', 'Gà, măng, nấm và lá é trong nước dùng thanh; kèm bún, dùng cho 3–4 người.', 299000),
    ('20000000-0000-4000-8000-000000000029', 'Lẩu', 'Lẩu bò nấm', 'Bắp bò, gân bò, đậu hũ và nấm; kèm rau và mì, dùng cho 3–4 người.', 329000),
    ('20000000-0000-4000-8000-000000000030', 'Cơm', 'Cơm chiên hải sản', 'Cơm chiên tôm, mực, trứng và rau củ; phần 1–2 người.', 89000),
    ('20000000-0000-4000-8000-000000000031', 'Cơm', 'Cơm chiên Dương Châu', 'Cơm chiên xá xíu, lạp xưởng, trứng và rau củ; phần 1–2 người.', 79000),
    ('20000000-0000-4000-8000-000000000032', 'Cơm', 'Cơm trắng thố', 'Cơm gạo thơm nấu nóng, một thố dùng cho 2–3 người.', 25000),
    ('20000000-0000-4000-8000-000000000033', 'Mì và bún', 'Mì xào bò', 'Mì trứng xào thịt bò, cải thìa, cà rốt và hành tây.', 89000),
    ('20000000-0000-4000-8000-000000000034', 'Mì và bún', 'Bún xào hải sản', 'Bún gạo xào tôm, mực, giá và rau cải.', 89000),
    ('20000000-0000-4000-8000-000000000035', 'Rau và món chay', 'Rau muống xào tỏi', 'Rau muống xào nhanh với tỏi, giữ độ xanh và giòn.', 49000),
    ('20000000-0000-4000-8000-000000000036', 'Rau và món chay', 'Đậu hũ sốt nấm', 'Đậu hũ mềm sốt nấm đông cô và nấm bào ngư, dùng gia vị chay.', 69000),
    ('20000000-0000-4000-8000-000000000037', 'Tráng miệng', 'Chè hạt sen long nhãn', 'Hạt sen nấu cùng long nhãn, ngọt thanh; dùng lạnh, phần 1 chén.', 35000),
    ('20000000-0000-4000-8000-000000000038', 'Tráng miệng', 'Trái cây theo mùa', 'Đĩa trái cây gồm dưa hấu, thơm và thanh long; phần 2–3 người.', 59000),
    ('20000000-0000-4000-8000-000000000039', 'Nước ép', 'Nước ép cam', 'Cam tươi ép, phục vụ ly 300 ml; có thể điều chỉnh đường và đá.', 45000),
    ('20000000-0000-4000-8000-000000000040', 'Nước ép', 'Nước ép dưa hấu', 'Dưa hấu tươi ép, phục vụ ly 300 ml; có thể điều chỉnh đường và đá.', 35000),
    ('20000000-0000-4000-8000-000000000041', 'Sinh tố', 'Sinh tố bơ', 'Bơ xay cùng sữa đặc và sữa tươi, phục vụ ly 350 ml.', 49000),
    ('20000000-0000-4000-8000-000000000042', 'Sinh tố', 'Sinh tố xoài', 'Xoài chín xay cùng sữa và đá, phục vụ ly 350 ml.', 45000),
    ('20000000-0000-4000-8000-000000000043', 'Trà', 'Trà đào cam sả', 'Trà đen pha đào, cam tươi và sả, phục vụ ly 400 ml.', 45000),
    ('20000000-0000-4000-8000-000000000044', 'Trà', 'Trà chanh', 'Trà lài pha chanh tươi, phục vụ ly 350 ml.', 29000),
    ('20000000-0000-4000-8000-000000000045', 'Cà phê', 'Cà phê đen đá', 'Cà phê phin rang xay phục vụ với đá, ly 200 ml.', 29000),
    ('20000000-0000-4000-8000-000000000046', 'Cà phê', 'Cà phê sữa đá', 'Cà phê phin kết hợp sữa đặc, phục vụ với đá, ly 250 ml.', 35000),
    ('20000000-0000-4000-8000-000000000047', 'Nước giải khát', 'Coca-Cola', 'Nước ngọt Coca-Cola lon 320 ml.', 20000),
    ('20000000-0000-4000-8000-000000000048', 'Nước giải khát', 'Sprite', 'Nước ngọt Sprite vị chanh lon 320 ml.', 20000),
    ('20000000-0000-4000-8000-000000000049', 'Nước giải khát', 'Nước suối', 'Nước uống đóng chai 500 ml, phục vụ lạnh hoặc nhiệt độ thường.', 15000),
    ('20000000-0000-4000-8000-000000000050', 'Nước giải khát', 'Nước dừa tươi', 'Một trái dừa tươi, phục vụ kèm cơm dừa và đá riêng.', 35000)
) AS seed(id, category_name, name, description, price_vnd)
JOIN categories category ON category.name = seed.category_name
WHERE NOT EXISTS (
    SELECT 1 FROM menu_items existing
    WHERE existing.category_id = category.id AND existing.name = seed.name
);

-- Randomly distributed capacities, fixed once seeded; all tables start available.
INSERT INTO restaurant_tables (id, name, capacity, status, is_active)
SELECT CAST(seed.id AS UUID), seed.name, seed.capacity, 'AVAILABLE', TRUE
FROM (VALUES
    ('30000000-0000-4000-8000-000000000001', 'Bàn 01', 4),
    ('30000000-0000-4000-8000-000000000002', 'Bàn 02', 2),
    ('30000000-0000-4000-8000-000000000003', 'Bàn 03', 6),
    ('30000000-0000-4000-8000-000000000004', 'Bàn 04', 4),
    ('30000000-0000-4000-8000-000000000005', 'Bàn 05', 8),
    ('30000000-0000-4000-8000-000000000006', 'Bàn 06', 2),
    ('30000000-0000-4000-8000-000000000007', 'Bàn 07', 4),
    ('30000000-0000-4000-8000-000000000008', 'Bàn 08', 6),
    ('30000000-0000-4000-8000-000000000009', 'Bàn 09', 4),
    ('30000000-0000-4000-8000-000000000010', 'Bàn 10', 10),
    ('30000000-0000-4000-8000-000000000011', 'Bàn 11', 2),
    ('30000000-0000-4000-8000-000000000012', 'Bàn 12', 6),
    ('30000000-0000-4000-8000-000000000013', 'Bàn 13', 4),
    ('30000000-0000-4000-8000-000000000014', 'Bàn 14', 8),
    ('30000000-0000-4000-8000-000000000015', 'Bàn 15', 4),
    ('30000000-0000-4000-8000-000000000016', 'Bàn 16', 2),
    ('30000000-0000-4000-8000-000000000017', 'Bàn 17', 6),
    ('30000000-0000-4000-8000-000000000018', 'Bàn 18', 8),
    ('30000000-0000-4000-8000-000000000019', 'Bàn 19', 4),
    ('30000000-0000-4000-8000-000000000020', 'Bàn 20', 2),
    ('30000000-0000-4000-8000-000000000021', 'Bàn 21', 10),
    ('30000000-0000-4000-8000-000000000022', 'Bàn 22', 4),
    ('30000000-0000-4000-8000-000000000023', 'Bàn 23', 6),
    ('30000000-0000-4000-8000-000000000024', 'Bàn 24', 2),
    ('30000000-0000-4000-8000-000000000025', 'Bàn 25', 8)
) AS seed(id, name, capacity)
WHERE NOT EXISTS (SELECT 1 FROM restaurant_tables existing WHERE existing.name = seed.name);
