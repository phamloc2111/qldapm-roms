-- Use the original public HTTPS image URL for each sample dish.
-- Replace the corresponding V5 local path, empty URLs and the old placeholder.
-- Preserve manually configured URLs. Sources: fe/src/data/menuImageSources.json.

UPDATE menu_items
SET image_url = 'https://product.hstatic.net/200000679901/product/cha_gio_hai_san_fd7a49f76aad479e853b09d5a9e38a1e_master.jpg'
WHERE name = 'Chả giò hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/cha-gio-hai-san.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://resfood.vn/cdn/images/202610/goods_img/khoai-tay-chien-G17974-1792247412308.jpg'
WHERE name = 'Khoai tây chiên'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/khoai-tay-chien.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.tgdd.vn/2023/08/CookRecipe/GalleryStep/lam-dau-hu-lac-sa-3.jpg'
WHERE name = 'Đậu hũ chiên sả'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Khai vị')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/dau-hu-chien-sa.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://barona.vn/storage/goi-ngo-sen.jpg'
WHERE name = 'Gỏi ngó sen tôm thịt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/goi-ngo-sen-tom-thit.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cookbeo.com/media/2020/10/salad-rau/salad-rau.jpg'
WHERE name = 'Salad rau củ sốt mè rang'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/salad-rau-cu-sot-me-rang.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://giupviechongdoan.com/wp-content/uploads/2023/08/goi-xoai-kho-muc.jpg'
WHERE name = 'Gỏi xoài khô mực'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Gỏi và salad')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/goi-xoai-kho-muc.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://barona.vn/storage/cong-thuc/sup-cua-trung-cut.jpg'
WHERE name = 'Súp cua trứng cút'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Súp')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/sup-cua-trung-cut.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://tiecbuigia.vn/wp-content/uploads/2017/06/1476333607_cach-nau-sup-ga_thumb_300x223.8.jpg'
WHERE name = 'Súp gà nấm hương'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Súp')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/sup-ga-nam-huong.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://soulbenthanh.com/upload/news/07053160.png'
WHERE name = 'Bò lúc lắc khoai tây'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/bo-luc-lac-khoai-tay.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://thanhnien.mediacdn.vn/Uploaded/2014/saigonamthuc.thanhnien.com.vn/Pictures201406/Tan_Nhan/thien_ly_xao_bo_06.jpg'
WHERE name = 'Bò xào thiên lý'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/bo-xao-thien-ly.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://navicdn.com/nakk/images_article/2019/01/16/cach-lam-bap-bo-hap-gung-sa-3.jpg'
WHERE name = 'Bắp bò hấp gừng'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món bò')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/bap-bo-hap-gung.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.hstatic.net/products/200001057701/suon-non-rim-man_1335d3a1714d495ea6cf77d65f2c30b3_1024x1024.jpg'
WHERE name = 'Sườn non rim mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/suon-non-rim-mam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://file.hstatic.net/200000448055/article/ba-roi-nuong-me-rieng_c9746529514b44629d0708ad3d10cca8.png'
WHERE name = 'Ba chỉ nướng riềng mẻ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ba-chi-nuong-rieng-me.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://www.hungryhuy.com/wp-content/uploads/sq-1-thit-kho.jpg'
WHERE name = 'Thịt kho trứng'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món heo')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/thit-kho-trung.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://file.hstatic.net/200000700229/file/canh-ga-chien-nuoc-mam-8.jpg'
WHERE name = 'Cánh gà chiên nước mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/canh-ga-chien-nuoc-mam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://congthucgiadinh.com/storage/97/01J2WTAN7BCHCHYZKD6Z55NB6E.jpg'
WHERE name = 'Gà nướng muối ớt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ga-nuong-muoi-ot.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://image.bephoa.vn/data/thumb_750/2024/08/202408141657403396.webp'
WHERE name = 'Gà hấp lá chanh'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món gà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ga-hap-la-chanh.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://pub-96b9f8c4e4604da1800bfe98632d0a67.r2.dev/recipes/786e805e-49ca-41a6-95e2-bddfad4dc078.jpg'
WHERE name = 'Vịt quay ngũ vị'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món vịt')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/vit-quay-ngu-vi.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/163175/Originals/vit-xao-sa-ot-7%281%29.jpg'
WHERE name = 'Vịt xào sả ớt'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Món vịt')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/vit-xao-sa-ot.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://nhahangthoangviet.vn/upload/product/cadieuhonghaphongkong-3803.jpg'
WHERE name = 'Cá diêu hồng hấp Hồng Kông'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ca-dieu-hong-hap-hong-kong.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.tgdd.vn/Files/2021/02/23/1329799/bi-quyet-nau-ca-kho-to-ngon-chuan-vi-ca-dai-mau-sac-chuan-dep-202102231126048896.jpg'
WHERE name = 'Cá lóc kho tộ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ca-loc-kho-to.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://storage.quannhautudo.com/data/thumb_800/Data/images/product/2024/05/20240530100945073.webp'
WHERE name = 'Cá chẽm chiên giòn'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cá')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ca-chem-chien-gion.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://product.hstatic.net/200000325181/product/tom_su_rang_muoi_a73c88ee5d084de3811e1effbb238421_grande.jpg'
WHERE name = 'Tôm sú rang muối'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tôm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/tom-su-rang-muoi.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cooponline.vn/tin-tuc/wp-content/uploads/2026/03/tom-hap-nuoc-dua-ngon-ngot-de-lam-tai-nha-ai-cung-thich.jpg'
WHERE name = 'Tôm hấp nước dừa'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tôm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/tom-hap-nuoc-dua.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://1shop.vn/datafiles/138/2025-04/31310994-Muc-Chien.png'
WHERE name = 'Mực chiên nước mắm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mực')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/muc-chien-nuoc-mam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.24h.com.vn/upload/4-2024/images/2024-11-27/1732676953-112-thumbnail-width740height495_anh_cat_3_2_schema_article.jpg'
WHERE name = 'Mực nướng sa tế'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mực')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/muc-nuong-sa-te.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://resfood.vn/cdn/images/recipe/202610/px-16629.jpg'
WHERE name = 'Lẩu Thái hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/lau-thai-hai-san.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://mocdiep.vn/images/san-pham/La-e/lau-ga-la-e.jpg'
WHERE name = 'Lẩu gà lá é'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/lau-ga-la-e.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://gofood.vn/upload/r/tong-hop-tin-tuc/huong-dan-mon-ngon/cach-nau-lau-bo-nam.jpg'
WHERE name = 'Lẩu bò nấm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Lẩu')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/lau-bo-nam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://haisanxomvang.vn/datafiles/thumb_1671849169_com-rang-hai-san--80k-1-suat.jpg'
WHERE name = 'Cơm chiên hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/com-chien-hai-san.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://img-global.cpcdn.com/recipes/c402baccf695bf30/680x781cq80/c%C6%A1m-chien-d%C6%B0%C6%A1ng-chau-recipe-main-photo.jpg'
WHERE name = 'Cơm chiên Dương Châu'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/com-chien-duong-chau.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://convoivang.vn/thumbs/360x360x2/upload/product/wh-rice-6863.png'
WHERE name = 'Cơm trắng thố'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cơm')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/com-trang-tho.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/163862/Originals/mi-xao-bo-13.jpg'
WHERE name = 'Mì xào bò'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mì và bún')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/mi-xao-bo.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://hangduongquan.vn/datafiles/124/upload/images/L%E1%BA%A9u%20c%C6%A1m%20b%C3%BAn/B%C3%BAn%20G%E1%BA%A1o%20X%C3%A0o%20H%E1%BA%A3i%20S%E1%BA%A3n.JPG'
WHERE name = 'Bún xào hải sản'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Mì và bún')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/bun-xao-hai-san.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://giadinh.mediacdn.vn/2019/3/8/photo-0-1552054427496568151353.jpg'
WHERE name = 'Rau muống xào tỏi'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Rau và món chay')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/rau-muong-xao-toi.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://sen7.vn/thumbs/1080x1080x2/upload/product/mon-chay-6-8260.png'
WHERE name = 'Đậu hũ sốt nấm'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Rau và món chay')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/dau-hu-sot-nam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://bepmina.vn/wp-content/uploads/2021/08/cach-nau-che-hat-sen-long-nhan-768x576.jpeg'
WHERE name = 'Chè hạt sen long nhãn'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tráng miệng')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/che-hat-sen-long-nhan.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://yeutre.vn/cdn/medias/uploads/32/32005-dia-trai-cay-dep-mat-32.jpg'
WHERE name = 'Trái cây theo mùa'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Tráng miệng')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/trai-cay-theo-mua.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://media.vov.vn/sites/default/files/styles/large/public/2023-12/tac_dung_cua_nuoc_cam.jpg'
WHERE name = 'Nước ép cam'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước ép')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/nuoc-ep-cam.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.cuabac.com/product/images/50/nuoc-ep-dua-hau-1756177635.webp'
WHERE name = 'Nước ép dưa hấu'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước ép')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/nuoc-ep-dua-hau.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://res.cloudinary.com/dsqh4hl2h/image/upload/reviet/product-nonebg/sinh-to-bo.webp'
WHERE name = 'Sinh tố bơ'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Sinh tố')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/sinh-to-bo.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn2.fptshop.com.vn/unsafe/2024_4_11_638484674583694515_cach-lam-sinh-to-xoai-voi-sua-tuoi.jpg'
WHERE name = 'Sinh tố xoài'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Sinh tố')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/sinh-to-xoai.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://bizweb.dktcdn.net/thumb/large/100/479/802/products/hinh-anh-tra-dao-cam-sa.jpg?v=1707282082987'
WHERE name = 'Trà đào cam sả'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Trà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/tra-dao-cam-sa.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://kopitemanlama.menu-kopi.id/img/Lemon%20Tea.jpg'
WHERE name = 'Trà chanh'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Trà')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/tra-chanh.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://cdn.cuabac.com/product/images/33/phin-den-da-1756173749.jpg'
WHERE name = 'Cà phê đen đá'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cà phê')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ca-phe-den-da.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://lasams.vn/uploads/la-sams-25-muzpbnhm.jpg'
WHERE name = 'Cà phê sữa đá'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Cà phê')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/ca-phe-sua-da.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://lh3.googleusercontent.com/Yt9TJJCeiED78kvPyImmLOxaK08idSId6NA5REG3MC4elBO1OF14zBIF5hJ7OsuWXZSJp1wP9EKikm-dBsm-6nwCH8itS6V7'
WHERE name = 'Coca-Cola'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/coca-cola.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://phohoaph.com/cdn/shop/products/SPRITE_1200x1200.jpg?v=1695272744'
WHERE name = 'Sprite'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/sprite.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://nuocsuoi.vn/wp-content/uploads/nuoc-lavie-500ml-nguyen-ban-160326-112020.jpg'
WHERE name = 'Nước suối'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/nuoc-suoi.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');

UPDATE menu_items
SET image_url = 'https://phunuvietnam.mediacdn.vn/179072216278405120/2022/10/6/nuoc-dua-co-gas-khong-1665025029622454245045.jpeg'
WHERE name = 'Nước dừa tươi'
  AND category_id IN (SELECT id FROM categories WHERE name = 'Nước giải khát')
  AND (image_url IS NULL OR TRIM(image_url) = ''
       OR image_url = '/images/menu/nuoc-dua-tuoi.webp'
       OR image_url LIKE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c%');
