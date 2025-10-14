// data.js
// Импортируем все нужные изображения из src/assets/images
import electronicsImg from "../assets/images/electronics.png";
import clothingImg from "../assets/images/clothing.png";
import booksImg from "../assets/images/books.png";
import furnitureImg from "../assets/images/furniture.png";
import outdoorImg from "../assets/images/outdoor.png";

import laptopImg from "../assets/images/laptop.png";
import smartphoneImg from "../assets/images/smartphone.png";
import headphonesImg from "../assets/images/headphones.png";
import monitorImg from "../assets/images/monitor.png";
import tshirtImg from "../assets/images/t-shirt.png";
import jeansImg from "../assets/images/jeans.png";
import jacketImg from "../assets/images/jacket.png";
import sneakersImg from "../assets/images/sneakers.png";
import novelImg from "../assets/images/novel.png";
import textbookImg from "../assets/images/textbook.png";
import magazineImg from "../assets/images/magazine.png";
import comicBookImg from "../assets/images/comicBook.png";
import deskChairImg from "../assets/images/deskChair.png";
import tableImg from "../assets/images/table.png";
import bookshelfImg from "../assets/images/bookshelf.png";
import lampImg from "../assets/images/lamp.png";
import bicycleImg from "../assets/images/bicycle.png";
import scooterImg from "../assets/images/scooter.png";
import rollerSkatesImg from "../assets/images/rollerSkates.png";
import skateboardImg from "../assets/images/skateboard.png";

// Категории
export const categories = [
  { id: "Electronics", name: "Electronics", img: electronicsImg },
  { id: "Clothing", name: "Clothing", img: clothingImg },
  { id: "Books", name: "Books", img: booksImg },
  { id: "Furniture", name: "Furniture", img: furnitureImg },
  { id: "Outdoor", name: "Outdoor", img: outdoorImg },
];

// Товары
export const products = [
  {
    id: 1,
    categoryId: "Electronics",
    name: "Laptop",
    price: 1200,
    img: laptopImg,
  },
  {
    id: 2,
    categoryId: "Electronics",
    name: "Smartphone",
    price: 800,
    img: smartphoneImg,
  },
  {
    id: 3,
    categoryId: "Electronics",
    name: "Headphones",
    price: 150,
    img: headphonesImg,
  },
  {
    id: 4,
    categoryId: "Electronics",
    name: "Monitor",
    price: 300,
    img: monitorImg,
  },
  {
    id: 5,
    categoryId: "Clothing",
    name: "T-Shirt",
    price: 20,
    img: tshirtImg,
  },
  {
    id: 6,
    categoryId: "Clothing",
    name: "Jeans",
    price: 50,
    img: jeansImg,
  },
  {
    id: 7,
    categoryId: "Clothing",
    name: "Jacket",
    price: 100,
    img: jacketImg,
  },
  {
    id: 8,
    categoryId: "Clothing",
    name: "Sneakers",
    price: 70,
    img: sneakersImg,
  },
  {
    id: 9,
    categoryId: "Books",
    name: "Novel",
    price: 15,
    img: novelImg,
  },
  {
    id: 10,
    categoryId: "Books",
    name: "Textbook",
    price: 40,
    img: textbookImg,
  },
  {
    id: 11,
    categoryId: "Books",
    name: "Magazine",
    price: 10,
    img: magazineImg,
  },
  {
    id: 12,
    categoryId: "Books",
    name: "Comic Book",
    price: 12,
    img: comicBookImg,
  },
  {
    id: 13,
    categoryId: "Furniture",
    name: "Desk Chair",
    price: 200,
    img: deskChairImg,
  },
  {
    id: 14,
    categoryId: "Furniture",
    name: "Table",
    price: 150,
    img: tableImg,
  },
  {
    id: 15,
    categoryId: "Furniture",
    name: "Bookshelf",
    price: 120,
    img: bookshelfImg,
  },
  {
    id: 16,
    categoryId: "Furniture",
    name: "Lamp",
    price: 80,
    img: lampImg,
  },
  {
    id: 17,
    categoryId: "Outdoor",
    name: "Bicycle",
    price: 500,
    img: bicycleImg,
  },
  {
    id: 18,
    categoryId: "Outdoor",
    name: "Scooter",
    price: 300,
    img: scooterImg,
  },
  {
    id: 19,
    categoryId: "Outdoor",
    name: "Roller Skates",
    price: 150,
    img: rollerSkatesImg,
  },
  {
    id: 20,
    categoryId: "Outdoor",
    name: "Skateboard",
    price: 120,
    img: skateboardImg,
  },
];
