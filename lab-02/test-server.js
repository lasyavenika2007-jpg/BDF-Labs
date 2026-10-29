const http = require('http');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const express = require('express');

// We can test against a running server on port 3000
const BASE_URL = 'http://localhost:3000';

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting Lab 2 Verification Tests ---\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  try {
    // 1. GET /books/
    console.log('1. Testing GET /books/');
    const resAll = await request('/books/');
    assert(resAll.status === 200, 'GET /books/ returns status 200');
    assert(Array.isArray(resAll.data), 'GET /books/ returns an array');
    assert(resAll.data.length >= 10, `GET /books/ returns at least 10 books (got ${resAll.data.length})`);

    // 2. GET /books/1/
    console.log('\n2. Testing GET /books/1/');
    const resOne = await request('/books/1/');
    assert(resOne.status === 200, 'GET /books/1/ returns status 200');
    assert(resOne.data.id === 1, 'GET /books/1/ returns book with id 1');
    assert(resOne.data.title === 'To Kill a Mockingbird', 'GET /books/1/ returns correct title');

    // 3. GET /books/99999/ (Not Found)
    console.log('\n3. Testing GET /books/99999/');
    const resNotFound = await request('/books/99999/');
    assert(resNotFound.status === 404, 'GET /books/99999/ returns status 404');

    // 4. POST /books/ with invalid input
    console.log('\n4. Testing POST /books/ invalid input');
    const resPostInvalid = await request('/books/', {
      method: 'POST',
      body: { title: 'Missing Fields' },
    });
    assert(resPostInvalid.status === 400, 'POST /books/ with missing fields returns status 400');

    // 5. POST /books/ with valid input
    console.log('\n5. Testing POST /books/ valid input');
    const newBook = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 650,
      pages: 464,
    };
    const resPost = await request('/books/', {
      method: 'POST',
      body: newBook,
    });
    assert(resPost.status === 201, 'POST /books/ returns status 201');
    assert(resPost.data.bookId !== undefined, 'POST /books/ returns generated bookId');
    const createdId = resPost.data.bookId;

    // Verify insertion in GET
    const resVerifyPost = await request(`/books/${createdId}/`);
    assert(resVerifyPost.status === 200, `GET /books/${createdId}/ returns status 200`);
    assert(resVerifyPost.data.title === 'Clean Code', 'Inserted book title matches');

    // 6. PUT /books/:bookId/
    console.log(`\n6. Testing PUT /books/${createdId}/`);
    const updateData = {
      title: 'Clean Code (2nd Edition)',
      author: 'Robert C. Martin',
      price: 700,
      pages: 480,
    };
    const resPut = await request(`/books/${createdId}/`, {
      method: 'PUT',
      body: updateData,
    });
    assert(resPut.status === 200, 'PUT /books/:bookId/ returns status 200');

    // Verify update
    const resVerifyPut = await request(`/books/${createdId}/`);
    assert(resVerifyPut.data.title === 'Clean Code (2nd Edition)', 'Updated book title matches');
    assert(resVerifyPut.data.price === 700, 'Updated book price matches');

    // 7. PUT /books/99999/ (Not Found)
    console.log('\n7. Testing PUT /books/99999/');
    const resPutNotFound = await request('/books/99999/', {
      method: 'PUT',
      body: updateData,
    });
    assert(resPutNotFound.status === 404, 'PUT /books/99999/ returns status 404');

    // 8. DELETE /books/:bookId/
    console.log(`\n8. Testing DELETE /books/${createdId}/`);
    const resDelete = await request(`/books/${createdId}/`, {
      method: 'DELETE',
    });
    assert(resDelete.status === 200, 'DELETE /books/:bookId/ returns status 200');

    // Verify deletion
    const resVerifyDelete = await request(`/books/${createdId}/`);
    assert(resVerifyDelete.status === 404, 'Deleted book is now 404 Not Found');

    // 9. DELETE /books/99999/ (Not Found)
    console.log('\n9. Testing DELETE /books/99999/');
    const resDeleteNotFound = await request('/books/99999/', {
      method: 'DELETE',
    });
    assert(resDeleteNotFound.status === 404, 'DELETE /books/99999/ returns status 404');

    console.log(`\n--- Verification Summary: ${passed}/${total} assertions passed ---`);
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
