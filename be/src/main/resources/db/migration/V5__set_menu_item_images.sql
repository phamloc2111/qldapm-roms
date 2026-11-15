-- Supply per-dish images for catalogs already initialized by V4.
-- Paths are served by the frontend. Preserve manually configured image URLs.
-- Image provenance: fe/public/images/menu/sources.json.

UPDATE menu_items
SET image_url = '/images/menu/cha-gio-hai-san.webp'
WHERE name = 'Chả giò hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/khoai-tay-chien.webp'
WHERE name = 'Khoai tây chiên'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/dau-hu-chien-sa.webp'
WHERE name = 'Đậu hũ chiên sả'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/goi-ngo-sen-tom-thit.webp'
WHERE name = 'Gỏi ngó sen tôm thịt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/salad-rau-cu-sot-me-rang.webp'
WHERE name = 'Salad rau củ sốt mè rang'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/goi-xoai-kho-muc.webp'
WHERE name = 'Gỏi xoài khô mực'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/sup-cua-trung-cut.webp'
WHERE name = 'Súp cua trứng cút'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Súp')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/sup-ga-nam-huong.webp'
WHERE name = 'Súp gà nấm hương'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Súp')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/bo-luc-lac-khoai-tay.webp'
WHERE name = 'Bò lúc lắc khoai tây'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/bo-xao-thien-ly.webp'
WHERE name = 'Bò xào thiên lý'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/bap-bo-hap-gung.webp'
WHERE name = 'Bắp bò hấp gừng'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/suon-non-rim-mam.webp'
WHERE name = 'Sườn non rim mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ba-chi-nuong-rieng-me.webp'
WHERE name = 'Ba chỉ nướng riềng mẻ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/thit-kho-trung.webp'
WHERE name = 'Thịt kho trứng'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/canh-ga-chien-nuoc-mam.webp'
WHERE name = 'Cánh gà chiên nước mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ga-nuong-muoi-ot.webp'
WHERE name = 'Gà nướng muối ớt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ga-hap-la-chanh.webp'
WHERE name = 'Gà hấp lá chanh'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/vit-quay-ngu-vi.webp'
WHERE name = 'Vịt quay ngũ vị'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món vịt')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/vit-xao-sa-ot.webp'
WHERE name = 'Vịt xào sả ớt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món vịt')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ca-dieu-hong-hap-hong-kong.webp'
WHERE name = 'Cá diêu hồng hấp Hồng Kông'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ca-loc-kho-to.webp'
WHERE name = 'Cá lóc kho tộ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ca-chem-chien-gion.webp'
WHERE name = 'Cá chẽm chiên giòn'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/tom-su-rang-muoi.webp'
WHERE name = 'Tôm sú rang muối'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tôm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/tom-hap-nuoc-dua.webp'
WHERE name = 'Tôm hấp nước dừa'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tôm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/muc-chien-nuoc-mam.webp'
WHERE name = 'Mực chiên nước mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mực')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/muc-nuong-sa-te.webp'
WHERE name = 'Mực nướng sa tế'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mực')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/lau-thai-hai-san.webp'
WHERE name = 'Lẩu Thái hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/lau-ga-la-e.webp'
WHERE name = 'Lẩu gà lá é'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/lau-bo-nam.webp'
WHERE name = 'Lẩu bò nấm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/com-chien-hai-san.webp'
WHERE name = 'Cơm chiên hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/com-chien-duong-chau.webp'
WHERE name = 'Cơm chiên Dương Châu'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/com-trang-tho.webp'
WHERE name = 'Cơm trắng thố'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/mi-xao-bo.webp'
WHERE name = 'Mì xào bò'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mì và bún')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/bun-xao-hai-san.webp'
WHERE name = 'Bún xào hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mì và bún')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/rau-muong-xao-toi.webp'
WHERE name = 'Rau muống xào tỏi'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Rau và món chay')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/dau-hu-sot-nam.webp'
WHERE name = 'Đậu hũ sốt nấm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Rau và món chay')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/che-hat-sen-long-nhan.webp'
WHERE name = 'Chè hạt sen long nhãn'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tráng miệng')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/trai-cay-theo-mua.webp'
WHERE name = 'Trái cây theo mùa'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tráng miệng')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/nuoc-ep-cam.webp'
WHERE name = 'Nước ép cam'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước ép')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/nuoc-ep-dua-hau.webp'
WHERE name = 'Nước ép dưa hấu'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước ép')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/sinh-to-bo.webp'
WHERE name = 'Sinh tố bơ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Sinh tố')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/sinh-to-xoai.webp'
WHERE name = 'Sinh tố xoài'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Sinh tố')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/tra-dao-cam-sa.webp'
WHERE name = 'Trà đào cam sả'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Trà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/tra-chanh.webp'
WHERE name = 'Trà chanh'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Trà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ca-phe-den-da.webp'
WHERE name = 'Cà phê đen đá'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cà phê')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/ca-phe-sua-da.webp'
WHERE name = 'Cà phê sữa đá'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cà phê')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/coca-cola.webp'
WHERE name = 'Coca-Cola'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/sprite.webp'
WHERE name = 'Sprite'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/nuoc-suoi.webp'
WHERE name = 'Nước suối'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = '/images/menu/nuoc-dua-tuoi.webp'
WHERE name = 'Nước dừa tươi'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');
