INSERT INTO garment_categories (slug, name, description, sort_order) VALUES
('kurti', 'Kurti', 'Everyday and festive kurtis in all fits', 1),
('salwar-suit', 'Salwar Suit', 'Classic salwar suits with matching bottoms', 2),
('pant-kurti', 'Pant Kurti', 'Kurti paired with tailored pants', 3),
('palazzo', 'Palazzo', 'Palazzo sets in flowing fabrics', 4),
('one-piece', 'One Piece', 'One-piece dresses for occasions', 5),
('custom-dress', 'Custom Dress', 'Fully custom festive and casual dresses', 6);

INSERT INTO garments (category_id, name, description, base_price) VALUES
((SELECT id FROM garment_categories WHERE slug='kurti'), 'Straight-fit Cotton Kurti', 'Breezy daily-wear kurti', 999.00),
((SELECT id FROM garment_categories WHERE slug='kurti'), 'Festive Silk Kurti', 'Silk kurti with embroidered neckline', 1899.00),
((SELECT id FROM garment_categories WHERE slug='salwar-suit'), 'Classic Salwar Suit', 'Kurta with matching salwar and dupatta', 1499.00),
((SELECT id FROM garment_categories WHERE slug='pant-kurti'), 'Office Pant Kurti', 'Sharp kurti with tapered pants', 1299.00),
((SELECT id FROM garment_categories WHERE slug='palazzo'), 'Georgette Palazzo Set', 'Flowy palazzo with short kurti', 1599.00),
((SELECT id FROM garment_categories WHERE slug='one-piece'), 'Evening One-Piece', 'Occasion one-piece dress', 1799.00),
((SELECT id FROM garment_categories WHERE slug='custom-dress'), 'Bridal Custom Gown', 'Made-to-dream bridal wear', 4999.00),
((SELECT id FROM garment_categories WHERE slug='kurti'), 'A-line Festive Kurti', 'Flared festive kurti', 1399.00);

INSERT INTO garment_options (garment_id, option_type, option_value, price_delta)
SELECT g.id, o.t, o.v, o.d FROM garments g JOIN (
  SELECT 'fabric' t, 'Cotton' v, 0.00 d UNION ALL SELECT 'fabric','Silk',400.00 UNION ALL
  SELECT 'fabric','Georgette',250.00 UNION ALL SELECT 'fabric','Velvet',600.00 UNION ALL
  SELECT 'color','Emerald Green',0.00 UNION ALL SELECT 'color','Royal Maroon',0.00 UNION ALL
  SELECT 'color','Blush Pink',0.00 UNION ALL SELECT 'color','Sky Blue',0.00 UNION ALL
  SELECT 'neck','Round',0.00 UNION ALL SELECT 'neck','V-neck',0.00 UNION ALL
  SELECT 'neck','Boat',50.00 UNION ALL SELECT 'sleeve','Sleeveless',0.00 UNION ALL
  SELECT 'sleeve','Short',0.00 UNION ALL SELECT 'sleeve','3-4 Sleeve',0.00 UNION ALL
  SELECT 'sleeve','Full',100.00 UNION ALL SELECT 'length','Knee',0.00 UNION ALL
  SELECT 'length','Calf',0.00 UNION ALL SELECT 'length','Ankle',150.00 UNION ALL
  SELECT 'fit','Relaxed',0.00 UNION ALL SELECT 'fit','Straight',0.00 UNION ALL
  SELECT 'fit','Tailored',200.00 UNION ALL SELECT 'embroidery','None',0.00 UNION ALL
  SELECT 'embroidery','Neckline',300.00 UNION ALL SELECT 'embroidery','All-over',800.00 UNION ALL
  SELECT 'occasion','Festive',0.00 UNION ALL SELECT 'occasion','Wedding',0.00 UNION ALL
  SELECT 'occasion','Office',0.00 UNION ALL SELECT 'occasion','Casual',0.00 UNION ALL
  SELECT 'style','Traditional',0.00 UNION ALL SELECT 'style','Modern',0.00 UNION ALL
  SELECT 'style','Modest Festive',0.00 UNION ALL SELECT 'footwear','Juttis',0.00 UNION ALL
  SELECT 'footwear','Block Heels',0.00 UNION ALL SELECT 'footwear','Sneakers',0.00
) o;

INSERT INTO offers (title, description, discount_type, discount_value, first_order_only, is_active) VALUES
('Diwali Dhamaka — 10% off', 'Festive season special on all stitching', 'percent', 10.00, 0, 1),
('First Stitch — flat Rs 200 off', 'Welcome offer for new customers', 'flat', 200.00, 1, 1);
