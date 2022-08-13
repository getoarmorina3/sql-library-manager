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
router.get('/books', asyncHandler(async (req, res, next) => {
  let page = req.query.page;
  !page || page <= 0 ? res.redirect("?page=1") : null;
  const books = await Book.findAll({order:[["ID", "DESC"]], offset: (page - 1) * 9, limit: 9,});
  books.length <= 0 ? res.redirect("?page=1") + (page = 1) : res.render("index", { books, page, title: "Books" });
}));

// Renders books from databased based on search
router.get("/books/search", asyncHandler(async (req, res, next) => {
  const { query } = req.query;
  const books = await Book.findAll({
    where: { [Op.or]: [ { title: { [Op.like]: `%${query}%` } }, { author: { [Op.like]: `%${query}%` } }, { genre: { [Op.like]: `%${query}%` } }, { year: { [Op.like]: `%${query}%` } }, ],},});
  books.length > 0 ? res.render("index", { books, query, title: "Search Results"}) : res.render("index", { books, query, title: "No Search Results Found"});
})
);

module.exports = router;

// Renders new book form
router.get('/books/new', asyncHandler(async (req, res) => {
  res.render("new-book", { book: {}, title: "New Book"});
}));

/* POST creates book in database */
router.post('/books/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books");
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render("new-book", { book, errors: error.errors, title: "New Book" })
    } else {
      throw error;
    }  
  }
}));

/* Renders EDIT book form */
router.get('/books/:id', asyncHandler(async(req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render("update-book", { book , title: "Update Book" });      
  } else {
    res.render("page-not-found");
  }
}));

/* UPDATE book from database */
router.post('/books/:id', asyncHandler(async(req, res) => {
  let book;
  try{
    book = await Book.findByPk(req.params.id);
    if (book) {
      await book.update(req.body);
      res.redirect('/books');
    } else {
      res.render('page-not-found');
    }
  } catch(error){
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('update-book', {book, errors: error.errors, title:'Update Book'})
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
    res.render('page-not-found')
  }
}));

