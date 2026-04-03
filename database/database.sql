-- ============================================================
--  ECHO-GROOVES  |  MySQL Setup Queries
--  Run this entire file in MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS echo_grooves;
USE echo_grooves;

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,        -- store hashed in production
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── VINYLS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vinyls (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  artist      VARCHAR(150) NOT NULL,
  genre       VARCHAR(80),
  price       DECIMAL(8,2) NOT NULL,
  stock       INT DEFAULT 0,
  image_url   VARCHAR(300),
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  status      ENUM('pending','confirmed','shipped','delivered') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  vinyl_id    INT NOT NULL,
  quantity    INT NOT NULL,
  price       DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (vinyl_id) REFERENCES vinyls(id)
);

-- ============================================================
--  SEED DATA  –  Sample Vinyls
-- ============================================================

INSERT INTO vinyls (title, artist, genre, price, stock, image_url, description) VALUES
('Abbey Road',           'The Beatles',        'Rock',      24.99, 15, 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg',        'The iconic 1969 masterpiece featuring Come Together & Here Comes the Sun.'),
('Thriller',             'Michael Jackson',    'Pop',       22.99, 20, 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',   'The best-selling album of all time. Pure magic on wax.'),
('Kind of Blue',         'Miles Davis',        'Jazz',      29.99, 10, 'https://upload.wikimedia.org/wikipedia/commons/3/30/Miles_Davis_-_Kind_of_Blue.jpg','The greatest jazz album ever recorded. A timeless classic.'),
('Dark Side of the Moon','Pink Floyd',         'Rock',      27.99, 12, 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',        'A psychedelic journey through time, money & madness.'),
('Rumours',              'Fleetwood Mac',      'Rock',      23.99, 18, 'https://upload.wikimedia.org/wikipedia/en/f/f8/Fleetwood_Mac_-_Rumours.png',      'Heartbreak and harmony. One of rocks greatest albums.'),
('Purple Rain',          'Prince',             'Pop/Rock',  21.99, 14, 'https://upload.wikimedia.org/wikipedia/en/9/9a/Purplerain.jpg',                  'Prince at his absolute peak. Unforgettable from start to finish.'),
('Blue',                 'Joni Mitchell',      'Folk',      26.99,  8, 'https://upload.wikimedia.org/wikipedia/en/2/26/Joniblue.jpg',                    'Raw, intimate and breathtaking. A songwriter at their finest.'),
('Nevermind',            'Nirvana',            'Grunge',    20.99, 22, 'https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg',   'The record that changed rock music forever. Massive.'),
('What''s Going On',     'Marvin Gaye',        'Soul',      25.99,  9, 'https://upload.wikimedia.org/wikipedia/en/a/aa/MarvinGayeWhat%27sGoingOnalbum.jpg','A soulful protest album that still speaks to today.'),
('Blonde on Blonde',     'Bob Dylan',          'Folk Rock', 28.99,  7, 'https://upload.wikimedia.org/wikipedia/en/3/35/Bob_Dylan_-_Blonde_on_Blonde.jpg', 'Dylan at his most poetic. A double album of pure genius.');

-- ============================================================
--  USEFUL QUERIES  (for testing / reference)
-- ============================================================

-- View all vinyls
-- SELECT * FROM vinyls;

-- View all orders with user info
-- SELECT o.id, u.name, u.email, o.total, o.status, o.created_at
-- FROM orders o JOIN users u ON o.user_id = u.id;

-- View items in a specific order (change order_id as needed)
-- SELECT oi.*, v.title, v.artist FROM order_items oi
-- JOIN vinyls v ON oi.vinyl_id = v.id
-- WHERE oi.order_id = 1;

-- Reset auto-increment (if needed during testing)
-- TRUNCATE TABLE order_items;
-- TRUNCATE TABLE orders;
-- TRUNCATE TABLE users;
