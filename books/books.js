/**
 * 読書記録システム用のJavaScript
 */

// 読書ステータスの表示設定
const READ_STATUS_CONFIG = {
    'read': {
        label: '既読',
        class: 'status-read',
        icon: '✓'
    },
    'reading': {
        label: '読んでる途中',
        class: 'status-reading',
        icon: '📖'
    },
    'partially_read': {
        label: '読みたいところだけ読んだ',
        class: 'status-partially-read',
        icon: '📑'
    },
    'unread': {
        label: '未読',
        class: 'status-unread',
        icon: '📚'
    }
};

/**
 * 本の情報からDOM要素を生成する
 * @param {Object} book - 本の情報オブジェクト
 * @returns {HTMLElement} 本の情報を表示するDOM要素
 */
function createBookElement(book) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book-item';
    
    const statusConfig = READ_STATUS_CONFIG[book.is_read];
    
    bookDiv.innerHTML = `
        <div class="book-header">
            <h3 class="book-title">${book.title}</h3>
            <span class="book-status ${statusConfig.class}">
                <span class="status-icon">${statusConfig.icon}</span>
                <span class="status-label">${statusConfig.label}</span>
            </span>
        </div>
        <div class="book-meta">
            <div class="book-category">${book.category}</div>
            ${book.when ? `<div class="book-when">読了日: ${book.when}</div>` : ''}
            ${book.isbn ? `<div class="book-isbn">ISBN: ${book.isbn}</div>` : ''}
        </div>
        ${book.body ? `<div class="book-body">${book.body}</div>` : ''}
        ${book.link ? `<div class="book-link"><a href="${book.link}" target="_blank">詳細を見る</a></div>` : ''}
    `;
    
    return bookDiv;
}

/**
 * カテゴリ別に本をグループ化する
 * @param {Array} books - 本の配列
 * @returns {Object} カテゴリ別にグループ化された本のオブジェクト
 */
function groupBooksByCategory(books) {
    const grouped = {};
    
    books.forEach(book => {
        const category = book.category || 'その他';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(book);
    });
    
    return grouped;
}

/**
 * 読書ステータス別に本をグループ化する
 * @param {Array} books - 本の配列
 * @returns {Object} 読書ステータス別にグループ化された本のオブジェクト
 */
function groupBooksByStatus(books) {
    const grouped = {};
    
    books.forEach(book => {
        const status = book.is_read;
        if (!grouped[status]) {
            grouped[status] = [];
        }
        grouped[status].push(book);
    });
    
    return grouped;
}

/**
 * 本のリストを表示する
 * @param {Array} books - 表示する本の配列
 * @param {string} containerId - 表示先のコンテナ要素のID
 * @param {string} groupBy - グループ化の方法 ('category' | 'status' | 'none')
 */
function displayBooks(books, containerId, groupBy = 'category') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id '${containerId}' not found`);
        return;
    }
    
    container.innerHTML = '';
    
    if (groupBy === 'category') {
        const groupedBooks = groupBooksByCategory(books);
        
        Object.keys(groupedBooks).sort().forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'book-category-section';
            
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = `${category} (${groupedBooks[category].length}冊)`;
            
            const booksContainer = document.createElement('div');
            booksContainer.className = 'books-container';
            
            groupedBooks[category].forEach(book => {
                booksContainer.appendChild(createBookElement(book));
            });
            
            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(booksContainer);
            container.appendChild(categorySection);
        });
        
    } else if (groupBy === 'status') {
        const groupedBooks = groupBooksByStatus(books);
        const statusOrder = ['read', 'reading', 'partially_read', 'unread'];
        
        statusOrder.forEach(status => {
            if (groupedBooks[status]) {
                const statusSection = document.createElement('section');
                statusSection.className = 'book-status-section';
                
                const statusConfig = READ_STATUS_CONFIG[status];
                const statusHeader = document.createElement('h3');
                statusHeader.className = 'status-header';
                statusHeader.innerHTML = `
                    <span class="status-icon">${statusConfig.icon}</span>
                    <span class="status-label">${statusConfig.label}</span>
                    <span class="book-count">(${groupedBooks[status].length}冊)</span>
                `;
                
                const booksContainer = document.createElement('div');
                booksContainer.className = 'books-container';
                
                groupedBooks[status].forEach(book => {
                    booksContainer.appendChild(createBookElement(book));
                });
                
                statusSection.appendChild(statusHeader);
                statusSection.appendChild(booksContainer);
                container.appendChild(statusSection);
            }
        });
        
    } else {
        // グループ化なし
        const booksContainer = document.createElement('div');
        booksContainer.className = 'books-container';
        
        books.forEach(book => {
            booksContainer.appendChild(createBookElement(book));
        });
        
        container.appendChild(booksContainer);
    }
}

/**
 * 検索クエリを解析する
 * @param {string} query - 検索クエリ
 * @returns {Object} 解析されたクエリオブジェクト
 */
function parseSearchQuery(query) {
    if (!query.trim()) {
        return { terms: [], operators: [], notTerms: [] };
    }
    
    // クエリをトークンに分割（スペース区切り）
    const tokens = query.trim().split(/\s+/);
    const terms = [];
    const operators = [];
    const notTerms = []; // NOTが適用される検索語
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].toLowerCase();
        
        if (token === 'and' || token === '&&') {
            operators.push('AND');
        } else if (token === 'or' || token === '||') {
            operators.push('OR');
        } else if (token === 'not' || token === '!') {
            // NOTの次のトークンをnotTermsに追加
            if (i + 1 < tokens.length) {
                notTerms.push(tokens[i + 1]);
                i++; // 次のトークンをスキップ
            }
        } else {
            // 通常の検索語
            terms.push(tokens[i]);
        }
    }
    
    return { terms, operators, notTerms };
}

/**
 * 単一の検索語で本をマッチングする
 * @param {Object} book - 本の情報オブジェクト
 * @param {string} term - 検索語
 * @returns {boolean} マッチするかどうか
 */
function matchBook(book, term) {
    const termLower = term.toLowerCase();
    const titleMatch = book.title.toLowerCase().includes(termLower);
    const genreMatch = book.genre.toLowerCase().includes(termLower);
    const categoryMatch = book.category.toLowerCase().includes(termLower);
    const bodyMatch = book.body.toLowerCase().includes(termLower);
    
    // 読書ステータスの日本語名でも検索
    const statusConfig = READ_STATUS_CONFIG[book.is_read];
    const statusMatch = statusConfig && statusConfig.label.toLowerCase().includes(termLower);
    
    return titleMatch || genreMatch || categoryMatch || bodyMatch || statusMatch;
}

/**
 * 検索クエリに基づいて本をマッチングする
 * @param {Object} book - 本の情報オブジェクト
 * @param {Object} query - 解析されたクエリオブジェクト
 * @returns {boolean} マッチするかどうか
 */
function evaluateQuery(book, query) {
    const { terms, operators, notTerms } = query;
    
    // NOT条件をチェック（NOT条件にマッチする場合は除外）
    for (const notTerm of notTerms) {
        if (matchBook(book, notTerm)) {
            return false;
        }
    }
    
    if (terms.length === 0) {
        return true;
    }
    
    if (terms.length === 1) {
        return matchBook(book, terms[0]);
    }
    
    // 複数の検索語がある場合
    let result = matchBook(book, terms[0]);
    
    for (let i = 1; i < terms.length; i++) {
        const termMatch = matchBook(book, terms[i]);
        const operator = operators[i - 1] || 'AND'; // デフォルトはAND
        
        switch (operator) {
            case 'AND':
                result = result && termMatch;
                break;
            case 'OR':
                result = result || termMatch;
                break;
            default:
                result = result && termMatch; // デフォルトはAND
        }
    }
    
    return result;
}

/**
 * フィルタリング機能
 * @param {Array} books - 全本の配列
 * @param {string} searchTerm - 検索語
 * @param {string} categoryFilter - カテゴリフィルタ
 * @param {string} statusFilter - ステータスフィルタ
 * @returns {Array} フィルタリングされた本の配列
 */
function filterBooks(books, searchTerm = '', categoryFilter = '', statusFilter = '') {
    return books.filter(book => {
        // 検索語でのフィルタリング
        const matchesSearch = !searchTerm || (() => {
            const query = parseSearchQuery(searchTerm);
            return evaluateQuery(book, query);
        })();
        
        const matchesCategory = !categoryFilter || book.category === categoryFilter;
        const matchesStatus = !statusFilter || book.is_read === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
}

/**
 * インデックスファイルから本のリストを読み込む
 * @returns {Promise<Array>} 本の配列
 */
async function loadBooksFromIndex() {
    try {
        const response = await fetch('data/index.json');
        const indexData = await response.json();
        
        // 全本の詳細データを並列で読み込む
        const books = await Promise.all(
            indexData.books.map(async (bookInfo) => {
                try {
                    const bookResponse = await fetch(`data/individual/${bookInfo.filename}`);
                    if (!bookResponse.ok) {
                        throw new Error(`HTTP ${bookResponse.status}`);
                    }
                    const bookData = await bookResponse.json();
                    return bookData;
                } catch (error) {
                    console.error(`Failed to load book: ${bookInfo.filename}`, error);
                    // エラーの場合は空のデータで表示
                    return {
                        title: `読み込みエラー: ${bookInfo.filename}`,
                        isbn: "",
                        link: "",
                        when: "",
                        is_read: "unread",
                        body: "この本のデータを読み込めませんでした。",
                        genre: "その他",
                        category: "その他"
                    };
                }
            })
        );
        
        console.log(`Successfully loaded ${books.length} books`);
        return books;
    } catch (error) {
        console.error('Failed to load books index:', error);
        throw error;
    }
}

// グローバル変数
let allBooks = [];
let currentGenre = null;
let currentCategory = null;

/**
 * ジャンル別に本をグループ化する
 * @param {Array} books - 本の配列
 * @returns {Object} ジャンル別にグループ化された本のオブジェクト
 */
function groupBooksByGenre(books) {
    const grouped = {};
    
    books.forEach(book => {
        const genre = book.genre || 'その他';
        if (!grouped[genre]) {
            grouped[genre] = {};
        }
        
        const category = book.category || 'その他';
        if (!grouped[genre][category]) {
            grouped[genre][category] = [];
        }
        
        grouped[genre][category].push(book);
    });
    
    return grouped;
}

/**
 * ジャンル一覧を表示する
 * @param {Object} groupedBooks - ジャンル別にグループ化された本のオブジェクト
 */
function displayGenres(groupedBooks) {
    const genreList = document.getElementById('genre-list');
    genreList.innerHTML = '';
    
    Object.keys(groupedBooks).sort().forEach(genre => {
        const genreDiv = document.createElement('div');
        genreDiv.className = 'genre-item';
        
        const totalBooks = Object.values(groupedBooks[genre]).reduce((sum, books) => sum + books.length, 0);
        
        genreDiv.innerHTML = `
            <h4>${genre}</h4>
            <p>${totalBooks}冊</p>
        `;
        
        genreDiv.addEventListener('click', () => {
            currentGenre = genre;
            displayCategories(groupedBooks[genre]);
        });
        
        genreList.appendChild(genreDiv);
    });
}

/**
 * カテゴリ一覧を表示する
 * @param {Object} categoryBooks - カテゴリ別にグループ化された本のオブジェクト
 */
function displayCategories(categoryBooks) {
    const genreSelection = document.getElementById('genre-selection');
    const categorySelection = document.getElementById('category-selection');
    const bookSelection = document.getElementById('book-selection');
    const categoryList = document.getElementById('category-list');
    
    genreSelection.style.display = 'none';
    categorySelection.style.display = 'block';
    bookSelection.style.display = 'none'; // 本選択セクションを非表示にする
    
    categoryList.innerHTML = '';
    
    Object.keys(categoryBooks).sort().forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        
        const bookCount = categoryBooks[category].length;
        
        categoryDiv.innerHTML = `
            <h4>${category}</h4>
            <p>${bookCount}冊</p>
        `;
        
        categoryDiv.addEventListener('click', () => {
            currentCategory = category;
            displayBooks(categoryBooks[category]);
        });
        
        categoryList.appendChild(categoryDiv);
    });
}

/**
 * 本一覧を表示する
 * @param {Array} books - 表示する本の配列
 */
function displayBooks(books) {
    const categorySelection = document.getElementById('category-selection');
    const bookSelection = document.getElementById('book-selection');
    const bookList = document.getElementById('book-list');
    
    categorySelection.style.display = 'none';
    bookSelection.style.display = 'block';
    
    bookList.innerHTML = '';
    
    books.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book-item';
        
        const statusConfig = READ_STATUS_CONFIG[book.is_read];
        
        bookDiv.innerHTML = `
            <div class="book-header">
                <h4 class="book-title">${book.title}</h4>
                <span class="book-status ${statusConfig.class}">
                    <span class="status-icon">${statusConfig.icon}</span>
                    <span class="status-label">${statusConfig.label}</span>
                </span>
            </div>
            <div class="book-meta">
                ${book.when ? `<div class="book-when">読了日: ${book.when}</div>` : ''}
                ${book.isbn ? `<div class="book-isbn">ISBN: ${book.isbn}</div>` : ''}
            </div>
        `;
        
        bookDiv.addEventListener('click', () => {
            showBookDetail(book);
        });
        
        bookList.appendChild(bookDiv);
    });
}

/**
 * 本の詳細をモーダルで表示する
 * @param {Object} book - 本の情報オブジェクト
 */
function showBookDetail(book) {
    const modal = document.getElementById('book-modal');
    const bookDetail = document.getElementById('book-detail');
    
    const statusConfig = READ_STATUS_CONFIG[book.is_read];
    
    bookDetail.innerHTML = `
        <div class="book-detail-header">
            <h2>${book.title}</h2>
            <span class="book-status ${statusConfig.class}">
                <span class="status-icon">${statusConfig.icon}</span>
                <span class="status-label">${statusConfig.label}</span>
            </span>
        </div>
        <div class="book-detail-meta">
            <div class="book-detail-category">カテゴリ: ${book.category}</div>
            <div class="book-detail-genre">ジャンル: ${book.genre}</div>
            ${book.when ? `<div class="book-detail-when">読了日: ${book.when}</div>` : ''}
            ${book.isbn ? `<div class="book-detail-isbn">ISBN: ${book.isbn}</div>` : ''}
        </div>
        ${book.body ? `<div class="book-detail-body">${book.body}</div>` : ''}
        ${book.link ? `<div class="book-detail-link"><a href="${book.link}" target="_blank">詳細を見る</a></div>` : ''}
    `;
    
    modal.style.display = 'block';
}

/**
 * 検索結果を表示する
 * @param {Array} books - 検索結果の本の配列
 */
function displaySearchResults(books) {
    const genreSelection = document.getElementById('genre-selection');
    const categorySelection = document.getElementById('category-selection');
    const bookSelection = document.getElementById('book-selection');
    const bookList = document.getElementById('book-list');
    
    genreSelection.style.display = 'none';
    categorySelection.style.display = 'none';
    bookSelection.style.display = 'block';
    
    // 検索結果のヘッダーを更新
    const bookSelectionTitle = bookSelection.querySelector('h3');
    bookSelectionTitle.textContent = `検索結果 (${books.length}冊)`;
    
    displayBooks(books);
}

/**
 * ページ読み込み時に実行される初期化関数
 */
async function initializeBooksPage() {
    try {
        allBooks = await loadBooksFromIndex();
        
        // ジャンル別にグループ化
        const groupedBooks = groupBooksByGenre(allBooks);
        
        // ジャンル一覧を表示
        displayGenres(groupedBooks);
        
        // 検索機能の設定
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                if (searchTerm === '') {
                    // 検索クリア時はジャンル選択に戻る
                    document.getElementById('genre-selection').style.display = 'block';
                    document.getElementById('category-selection').style.display = 'none';
                    document.getElementById('book-selection').style.display = 'none';
                } else {
                    const filteredBooks = filterBooks(allBooks, searchTerm);
                    displaySearchResults(filteredBooks);
                }
            });
        }
        
        // 戻るボタンの設定
        const backToGenreBtn = document.getElementById('back-to-genre');
        const backToCategoryBtn = document.getElementById('back-to-category');
        
        if (backToGenreBtn) {
            backToGenreBtn.addEventListener('click', () => {
                document.getElementById('genre-selection').style.display = 'block';
                document.getElementById('category-selection').style.display = 'none';
                document.getElementById('book-selection').style.display = 'none';
                currentGenre = null;
                currentCategory = null;
            });
        }
        
        if (backToCategoryBtn) {
            backToCategoryBtn.addEventListener('click', () => {
                if (currentGenre) {
                    const groupedBooks = groupBooksByGenre(allBooks);
                    displayCategories(groupedBooks[currentGenre]);
                }
            });
        }
        
        // モーダルの設定
        const modal = document.getElementById('book-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Failed to load books data:', error);
        document.getElementById('genre-list').innerHTML = 
            '<p>本のデータを読み込めませんでした。</p>';
    }
}

// ページ読み込み完了時に初期化を実行
document.addEventListener('DOMContentLoaded', initializeBooksPage);
