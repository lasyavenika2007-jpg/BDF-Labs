const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'books.db');
let db = null;

// Initialize database and start the server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Endpoint 1: Get all books
app.get('/books/', async (request, response) => {
  try {
    const getBooksQuery = 'SELECT * FROM book ORDER BY id ASC;';
    const booksArray = await db.all(getBooksQuery);
    response.status(200).json(booksArray);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Get one book by ID
app.get('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;
    const getBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return response.status(404).json({ error: 'Book not found' });
    }

    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Add a new book
app.post('/books/', async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    if (!title || !author || price === undefined || pages === undefined || isNaN(price) || isNaN(pages)) {
      return response.status(400).json({
        error: 'Invalid input. Please provide title, author, price, and pages.',
      });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
    ]);

    response.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// Endpoint 4: Update a book by ID
app.put('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    // Check if the book exists
    const checkBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return response.status(404).json({ error: 'Book not found' });
    }

    if (!title || !author || price === undefined || pages === undefined || isNaN(price) || isNaN(pages)) {
      return response.status(400).json({
        error: 'Invalid input. Please provide title, author, price, and pages.',
      });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      bookId,
    ]);

    response.status(200).json({
      message: 'Book Updated Successfully',
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// Endpoint 5: Delete a book by ID
app.delete('/books/:bookId/', async (request, response) => {
  try {
    const { bookId } = request.params;

    // Check if the book exists
    const checkBookQuery = 'SELECT * FROM book WHERE id = ?;';
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return response.status(404).json({ error: 'Book not found' });
    }

    const deleteBookQuery = 'DELETE FROM book WHERE id = ?;';
    await db.run(deleteBookQuery, [bookId]);

    response.status(200).json({
      message: 'Book Deleted Successfully',
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = app;
