var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
var { Op } = require('sequelize');

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

/* Redirects from homepage to /books */
router.get('/', asyncHandler(async (req, res) => {
  res.redirect("/books");
}));

/* Renders /books and show the full list of books */
router.get('/books', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order: [["title", "ASC"]]});
  res.render("index", { books, title: "Libray Manager" });
}));

// Renders new book form
router.get('/books/new', asyncHandler(async (req, res) => {
  res.render("new-book", { book: {} });
}));

/* POST creates book in database */
router.post('/books/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books/");
  } catch (error) {
    if(error.name === "SequelizeValidationError") { // checking the error
      book = await Book.build(req.body);
      res.render("new-book", { book, errors: error.errors })
    } else {
      throw error;
    }  
  }
}));

/* Renders EDIT book form */
router.get('/books/:id', asyncHandler(async(req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render("update-book", { book });      
  } else {
    const err = new Error("book not found");
    err.status = 404;
    next(err);
  }
}));

/* UPDATE book from database */
router.post('/books/:id', asyncHandler(async (req, res, next) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect("/books"); 
    } else {
      const err = new Error("book not found");
      err.status = 404;
      next(err);
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id; // make sure correct book gets updated
      res.render("update-book", { book, errors: error.errors })
    } else {
      throw error;
    }
  }
}));

// DELETE book from database
router.post('/books/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    res.sendStatus(404);
  }
}));

module.exports = router;
